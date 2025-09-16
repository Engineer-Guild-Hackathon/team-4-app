import uuid
from typing import List
from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from django.db import connection, transaction, models
from mentorship.schemas import (
    MenteeActionStatusOut,
    MenteeSubtreeOut,
    MentorRequestIn,
    MentorRequestOut,
    TopicId,
    UserNodeOut,
    UserEasyOut,
    MenteeSelectionIn,
    MenteeInfoOut,
)
from config.schemas import ErrorOut
from topics.models import Topic, UserTopic
from .models import MentorRelationRequest, MentorRelation, ActionLog
User = get_user_model()

router = Router()

user_table = User._meta.db_table


def _remove_relation(relation: MentorRelation, action: str):
    """
    引数：
    - relation: 削除する師弟関係のインスタンス
    - action: "expel" または "graduate" のいずれかのアクション名
    説明：
    - 指定された師弟関係を削除し、アクションログを記録します。
    """
    mentor = relation.mentor
    mentee = relation.mentee
    relation.delete()

    # ログを記録
    ActionLog.objects.create(actor=mentor, target=mentee, action=action)

    return {"status": action, "mentee_id": mentee.id}


def _check_mentor_capacity(mentor_user, topic_id: uuid.UUID):
    """
    師匠の弟子定員をチェックする
    
    引数:
    - mentor_user: 師匠のユーザーオブジェクト
    - topic_id: トピックのUUID
    
    戻り値:
    - (is_within_capacity: bool, current_count: int, capacity: int)
    """
    try:
        mentor_user_topic = UserTopic.objects.get(user=mentor_user, topic_id=topic_id)
        capacity = mentor_user_topic.mentee_capacity
        
        # 現在の弟子数をカウント（アクティブな師弟関係のみ）
        current_count = MentorRelation.objects.filter(
            mentor=mentor_user, topic_id=topic_id
        ).count()
        
        is_within_capacity = current_count < capacity
        return is_within_capacity, current_count, capacity
        
    except UserTopic.DoesNotExist:
        # UserTopicが存在しない場合は定員0として扱う
        return False, 0, 0


def _update_descendant_levels(user, topic_id: uuid.UUID, level_difference: int):
    """
    引数
    - user: 弟子の末代までのレベルを更新する基点となるユーザー
    - topic_id: トピックのUUID
    - level_difference: レベルの差分（正の値でレベルアップ、負の値でレベルダウン）

    説明
    - 再起的CTEを用いて指定されたユーザーの配下の弟子全員（子孫）の特定のトピックのレベルを更新します。
    """
    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            WITH RECURSIVE subtree AS (
                SELECT id FROM {user_table} WHERE id = %s -- This is the anchor, but we exclude it below
                UNION ALL
                SELECT u.id
                FROM {user_table} u
                JOIN mentorship_mentorrelation mr ON u.id = mr.mentee_id
                JOIN subtree s ON mr.mentor_id = s.id
            )
            UPDATE topics_usertopic
            SET level = level + %s
            WHERE user_id IN (SELECT id FROM subtree WHERE id != %s) AND topic_id = %s;
        """,
            [user.id, level_difference, user.id, topic_id],
        )


@router.post(
    "/request",
    response={200: MentorRequestOut, 400: ErrorOut},
    summary="弟子入りリクエストを作成する",
    auth=JWTAuth(),
)
@transaction.atomic
def create_mentor_request(request: HttpRequest, payload: MentorRequestIn):
    """
    弟子入りリクエストを作成します。定員内の場合は直接師弟関係を作成し、
    定員超過の場合は承認制でリクエストを作成します。

    - 認証が必要です。
    - 自分自身にリクエストを送ることはできません。
    - 既に師弟関係にある、またはリクエスト中のユーザーには再度リクエストできません。
    """
    from_user = request.user
    to_user = get_object_or_404(User, id=payload.to_user_id)
    topic = get_object_or_404(Topic, id=payload.topic_id)

    # 自分自身へのリクエストを禁止
    if from_user.id == to_user.id:
        return 400, {"message": "You cannot send a mentor request to yourself."}

    # 既存の関係やリクエストをチェック
    if MentorRelation.objects.filter(mentee=from_user, mentor=to_user, topic=topic).exists():
        return 400, {"message": "You are already in a mentorship with this user."}
    if MentorRelationRequest.objects.filter(
        from_user=from_user, to_user=to_user, topic=topic, status="pending"
    ).exists():
        return 400, {"message": "A pending request to this user already exists."}

    # 師匠のレベルが弟子より高いかチェック
    try:
        from_user_topic = UserTopic.objects.get(user=from_user, topic=topic)
        to_user_topic = UserTopic.objects.get(user=to_user, topic=topic)
        if to_user_topic.level <= from_user_topic.level:
            return 400, {"message": "Mentor must have a higher level than the mentee."}
    except UserTopic.DoesNotExist:
        return 400, {"message": "UserTopic not found for the specified topic."}

    # 師匠の定員をチェック
    is_within_capacity, current_count, capacity = _check_mentor_capacity(to_user, payload.topic_id)
    
    if is_within_capacity:
        # 定員内の場合：直接師弟関係を作成（無条件）
        MentorRelation.objects.create(
            mentor=to_user,
            mentee=from_user,
            topic=topic,
        )
        
        # 弟子のUserTopicのレベルを師匠のレベル-1に設定し、statusをACTIVEにリセット
        try:
            mentor_user_topic = UserTopic.objects.get(user=to_user, topic=topic)
            mentee_user_topic = UserTopic.objects.get(
                user=from_user, 
                topic=topic
            )
            mentee_user_topic.level = mentor_user_topic.level - 1  # マイナスレベルも許可
            mentee_user_topic.status = UserTopic.Status.ACTIVE
            mentee_user_topic.save()
        except UserTopic.DoesNotExist:
            pass
        
        # 定員内の場合は承認済みリクエストとして記録
        mentor_request = MentorRelationRequest.objects.create(
            from_user=from_user, to_user=to_user, topic=topic, status="approved"
        )
        return mentor_request
    else:
        # 定員超過の場合：承認制でリクエストを作成
        mentor_request = MentorRelationRequest.objects.create(
            from_user=from_user, to_user=to_user, topic=topic
        )
        return mentor_request


# completed 阿部TODO: リクエストが来る→定員に達しているので、既存の弟子を破門or卒業させる→弟子が新しく入る。の流れを実装する
@router.post(
    "/requests/{request_id}/approve",
    response={200: ErrorOut, 403: ErrorOut, 404: ErrorOut},
    summary="弟子入りリクエストを承認する（定員内の場合）",
    auth=JWTAuth(),
)
@transaction.atomic
def approve_mentor_request(request: HttpRequest, request_id: int):
    """
    受け取った弟子入りリクエストを承認します。
    定員内の場合のみ使用してください。定員超過の場合は別のAPIを使用してください。

    - リクエストの宛先（to_user）である本人しか承認できません。
    - 承認されると、リクエストのステータスが `approved` になり、新しい師弟関係が作成されます。
    - 師弟関係が成立した時点で、弟子のUserTopicのstatusをACTIVEにリセットします。
    """
    mentor_request = get_object_or_404(
        MentorRelationRequest, id=request_id, status="pending"
    )

    # リクエストの宛先本人かチェック
    if request.user.id != mentor_request.to_user.id:
        return 403, {"message": "You do not have permission to perform this action."}

    # 定員をチェック
    is_within_capacity, current_count, capacity = _check_mentor_capacity(
        mentor_request.to_user, mentor_request.topic.id
    )
    
    if not is_within_capacity:
        return 400, {"message": "Capacity exceeded. Use the approve-with-selection API instead."}

    # 新しい師弟関係を作成
    MentorRelation.objects.create(
        mentor=mentor_request.to_user,
        mentee=mentor_request.from_user,
        topic=mentor_request.topic,
    )

    # 弟子のUserTopicのレベルを師匠のレベル-1に設定し、statusをACTIVEにリセット（師匠選択完了）
    try:
        mentor_user_topic = UserTopic.objects.get(
            user=mentor_request.to_user, 
            topic=mentor_request.topic
        )
        mentee_user_topic = UserTopic.objects.get(
            user=mentor_request.from_user, 
            topic=mentor_request.topic
        )
        mentee_user_topic.level = max(1, mentor_user_topic.level - 1)  # 最低レベルは1
        mentee_user_topic.status = UserTopic.Status.ACTIVE
        mentee_user_topic.save()
    except UserTopic.DoesNotExist:
        pass  # UserTopicが存在しない場合はスキップ

    # リクエストのステータスを更新
    mentor_request.status = MentorRelationRequest.Status.APPROVED
    mentor_request.save()

    return {"message": "Request approved successfully."}


@router.post(
    "/requests/{request_id}/approve-with-selection",
    response={200: ErrorOut, 403: ErrorOut, 404: ErrorOut, 400: ErrorOut},
    summary="弟子入りリクエストを承認する（定員超過時、弟子選択付き）",
    auth=JWTAuth(),
)
@transaction.atomic
def approve_mentor_request_with_selection(request: HttpRequest, request_id: int, selection: MenteeSelectionIn):
    """
    受け取った弟子入りリクエストを承認し、定員超過の場合は指定された弟子を破門または卒業させます。

    - リクエストの宛先（to_user）である本人しか承認できません。
    - 定員超過の場合は、指定された弟子を破門または卒業させて新しい弟子を受け入れます。
    - 師弟関係が成立した時点で、弟子のUserTopicのstatusをACTIVEにリセットします。
    """
    mentor_request = get_object_or_404(
        MentorRelationRequest, id=request_id, status="pending"
    )

    # リクエストの宛先本人かチェック
    if request.user.id != mentor_request.to_user.id:
        return 403, {"message": "You do not have permission to perform this action."}

    # 定員をチェック
    is_within_capacity, current_count, capacity = _check_mentor_capacity(
        mentor_request.to_user, mentor_request.topic.id
    )
    
    if not is_within_capacity:
        # 定員超過の場合：指定された弟子を破門または卒業
        mentee_relation = get_object_or_404(
            MentorRelation,
            mentor=mentor_request.to_user,
            mentee_id=selection.mentee_id,
            topic=mentor_request.topic
        )
        
        if selection.action == "expel":
            # 弟子を破門
            mentee = mentee_relation.mentee
            mentor_level = request.user.usertopic_set.get(topic_id=mentor_request.topic.id).level
            mentee_level = mentee.usertopic_set.get(topic_id=mentor_request.topic.id).level
            level_difference = mentor_level - mentee_level
            
            # 破門された弟子のUserTopicのstatusをEXPELLEDに更新
            try:
                expelled_user_topic = UserTopic.objects.get(
                    user=mentee,
                    topic=mentor_request.topic
                )
                expelled_user_topic.status = UserTopic.Status.EXPELLED
                expelled_user_topic.save()
            except UserTopic.DoesNotExist:
                pass
            
            # 子孫のレベルを調整（負の値でレベルダウン）
            _update_descendant_levels(mentee, mentor_request.topic.id, -level_difference)
            
            _remove_relation(mentee_relation, action="expel")
                
        elif selection.action == "graduate":
            # 弟子を卒業
            mentee = mentee_relation.mentee
            mentor_level = request.user.usertopic_set.get(topic_id=mentor_request.topic.id).level
            mentee_level = mentee.usertopic_set.get(topic_id=mentor_request.topic.id).level
            
            # 弟子のレベルが師匠より高い場合は、師匠より1レベル高くする
            if mentee_level >= mentor_level:
                delta = 1
            else:
                delta = mentor_level - mentee_level
            
            user_topic = mentee.usertopic_set.get(topic_id=mentor_request.topic.id)
            user_topic.level += delta
            user_topic.status = UserTopic.Status.GRADUATED
            user_topic.save()
            
            # menteeの子孫のUserTopicのlevelを更新
            _update_descendant_levels(mentee, mentor_request.topic.id, delta)
            
            _remove_relation(mentee_relation, action="graduate")
        else:
            return 400, {"message": "Invalid action. Must be 'expel' or 'graduate'."}

    # 新しい師弟関係を作成
    MentorRelation.objects.create(
        mentor=mentor_request.to_user,
        mentee=mentor_request.from_user,
        topic=mentor_request.topic,
    )

    # 弟子のUserTopicのレベルを師匠のレベル-1に設定し、statusをACTIVEにリセット（師匠選択完了）
    try:
        mentor_user_topic = UserTopic.objects.get(
            user=mentor_request.to_user, 
            topic=mentor_request.topic
        )
        mentee_user_topic = UserTopic.objects.get(
            user=mentor_request.from_user, 
            topic=mentor_request.topic
        )
        mentee_user_topic.level = max(1, mentor_user_topic.level - 1)  # 最低レベルは1
        mentee_user_topic.status = UserTopic.Status.ACTIVE
        mentee_user_topic.save()
    except UserTopic.DoesNotExist:
        pass  # UserTopicが存在しない場合はスキップ

    # リクエストのステータスを更新
    mentor_request.status = MentorRelationRequest.Status.APPROVED
    mentor_request.save()

    return {"message": "Request approved successfully with mentee selection."}


@router.post(
    "/requests/{request_id}/reject",
    response={200: ErrorOut, 403: ErrorOut, 404: ErrorOut},
    summary="弟子入りリクエストを拒否する",
    auth=JWTAuth(),
)
def reject_mentor_request(request: HttpRequest, request_id: int):
    """
    受け取った弟子入りリクエストを拒否します。

    - リクエストの宛先（to_user）である本人しか拒否できません。
    """
    mentor_request = get_object_or_404(
        MentorRelationRequest, id=request_id, status="pending"
    )

    # リクエストの宛先本人かチェック
    if request.user.id != mentor_request.to_user.id:
        return 403, {"message": "You do not have permission to perform this action."}

    # リクエストのステータスを更新
    mentor_request.status = MentorRelationRequest.Status.REJECTED
    mentor_request.save()

    return {"message": "Request rejected successfully."}


@router.post(
    "/mentees/{mentee_id}/expel",
    response={200: MenteeActionStatusOut, 404: ErrorOut},
    summary="弟子を破門する",
    auth=JWTAuth(),
)
def expel_mentee(request: HttpRequest, mentee_id: int, data: TopicId):
    """
    自身の弟子を破門し、師弟関係を解消します。

    - 認証が必要です。
    - 指定されたIDのユーザーが、実行者の弟子である必要があります。
    """
    mentorship = get_object_or_404(
        MentorRelation, mentor=request.user, mentee_id=mentee_id, topic_id=data.topic_id
    )
    
    # UserTopicのstatusをEXPELLEDに更新
    user_topic = UserTopic.objects.get(user_id=mentee_id, topic_id=data.topic_id)
    user_topic.status = UserTopic.Status.EXPELLED
    user_topic.save()
    
    # 破門された弟子の子孫のレベルを調整（レベルダウン）
    mentee = mentorship.mentee
    mentor_level = request.user.usertopic_set.get(topic_id=data.topic_id).level
    mentee_level = mentee.usertopic_set.get(topic_id=data.topic_id).level
    level_difference = mentor_level - mentee_level
    
    # 子孫のレベルを調整（負の値でレベルダウン）
    _update_descendant_levels(mentee, data.topic_id, -level_difference)
    
    return _remove_relation(mentorship, action="expel")


# completed 阿部TODO: 現時点は弟子と同レベルであることを想定しているが、弟子の方が高レベルの場合、delta + 1とし、元師匠より1レベル高くさせる
@router.post(
    "/mentees/{mentee_id}/graduate",
    response={200: MenteeActionStatusOut, 404: ErrorOut},
    summary="弟子を卒業させる",
    auth=JWTAuth(),
)
def graduate_mentee(request: HttpRequest, mentee_id: int, data: TopicId):
    """
    自身の弟子を卒業させ、師弟関係を解消します。

    - 認証が必要です。
    - 指定されたIDのユーザーが、実行者の弟子である必要があります。
    """
    mentorship = get_object_or_404(
        MentorRelation, mentor=request.user, mentee_id=mentee_id, topic_id=data.topic_id
    )
    mentee = mentorship.mentee
    mentor_level = request.user.usertopic_set.get(topic_id=data.topic_id).level
    mentee_level = mentee.usertopic_set.get(topic_id=data.topic_id).level
    
    # 弟子のレベルが師匠より高い場合は、師匠より1レベル高くする
    if mentee_level >= mentor_level:
        delta = 1
    else:
        delta = mentor_level - mentee_level
    
    user_topic = mentee.usertopic_set.get(topic_id=data.topic_id)
    user_topic.level += delta
    # UserTopicのstatusをGRADUATEDに更新
    user_topic.status = UserTopic.Status.GRADUATED
    user_topic.save()
    # menteeの子孫のUserTopicのlevelを更新
    _update_descendant_levels(mentee, data.topic_id, delta)
    return _remove_relation(mentorship, action="graduate")

@router.get(
    "/mentors/{mentor_id}/subtree",
    response=List[MenteeSubtreeOut],
    summary="指定されたメンターの弟子ツリーを取得する",
    auth=JWTAuth(),
)
def get_mentor_subtree(request: HttpRequest, mentor_id: int):
    """
    指定されたメンターの全ての弟子（サブツリー）を取得します。
    """
    subtree = MentorRelation.objects.get_mentee_subtree(mentor_id)
    return subtree


@router.get(
    "/tree/",
    response=List[UserNodeOut],
    summary="全てのユーザーと師弟関係のツリーデータを取得する",
    auth=JWTAuth(),
)
def get_tree_data(request: HttpRequest):
    """
    全てのユーザーと師弟関係のツリーデータを取得する
    """
    users = User.objects.all()
    mentor_relations = MentorRelation.objects.all().select_related("mentor", "mentee")

    mentee_to_mentor = {
        relation.mentee.id: relation.mentor.id for relation in mentor_relations
    }

    data = []
    for user in users:
        mentor_id = mentee_to_mentor.get(user.id)
        data.append(
            UserNodeOut(
                user=UserEasyOut(id=user.id, username=user.username),
                rank=user.rank,
                mentor_id=mentor_id,
            )
        )
    
    return data

@router.get(
    "/mentor-selection/required/{topic_id}",
    summary="師匠選択が必要かどうかを判定",
    response={200: dict, 400: dict, 404: dict},
    auth=JWTAuth(),
)
def check_mentor_selection_required(request: HttpRequest, topic_id: str):
    """
    指定されたトピックで師匠選択が必要かどうかを判定します。
    
    - 師匠がいない AND 最高レベルではない AND 保留中のリクエストがない場合、師匠選択が必要
    """
    try:
        user_topic = UserTopic.objects.get(user=request.user, topic_id=topic_id)
        
        # 師匠がいるかチェック
        has_mentor = MentorRelation.objects.filter(
            mentee=request.user, topic_id=topic_id
        ).exists()
        
        # 保留中の師匠選択リクエストがあるかチェック
        has_pending_request = MentorRelationRequest.objects.filter(
            from_user=request.user, topic_id=topic_id, status="pending"
        ).exists()
        
        # 最高レベルかチェック
        max_level = UserTopic.objects.filter(topic_id=topic_id).aggregate(
            max_level=models.Max('level')
        )['max_level']
        
        is_max_level = user_topic.level == max_level
        
        # 師匠選択が必要な条件
        # 師匠がいない AND 最高レベルではない AND 保留中のリクエストがない
        selection_required = not has_mentor and not is_max_level and not has_pending_request
        
        return {
            "required": selection_required, 
            "reason": "No mentor or not at max level or no pending request.",
            "user_status": user_topic.status
        }
    except UserTopic.DoesNotExist:
        return 404, {"message": "UserTopic not found."}
@router.get(
    "/mentor-request-status/{topic_id}",
    summary="師匠選択リクエストの状態を取得",
    response={200: dict, 400: dict},
    auth=JWTAuth(),
)
def get_mentor_request_status(request: HttpRequest, topic_id: str):
    """
    指定されたトピックでの師匠選択リクエストの状態を取得します。
    """
    try:
        # 最新の師匠選択リクエストを取得
        latest_request = MentorRelationRequest.objects.filter(
            from_user=request.user, topic_id=topic_id
        ).order_by('-created_at').first()
        
        if not latest_request:
            return {"status": "none", "message": "No mentor request found"}
        
        return {
            "status": latest_request.status,
            "to_user_id": latest_request.to_user.id,
            "to_username": latest_request.to_user.username,
            "created_at": latest_request.created_at,
            "message": f"Request to {latest_request.to_user.username} is {latest_request.status}"
        }
    except Exception as e:
        return 400, {"message": f"Error retrieving request status: {str(e)}"}

@router.get(
    "/user-level/{topic_id}",
    summary="指定されたトピックでのユーザーの現在レベルを取得",
    response={200: dict, 404: dict},
    auth=JWTAuth(),
)
def get_user_level(request: HttpRequest, topic_id: str):
    """
    指定されたトピックでのユーザーの現在レベルを取得します。
    """
    try:
        user_topic = UserTopic.objects.get(user=request.user, topic_id=topic_id)
        return {
            "level": user_topic.level,
            "status": user_topic.status
        }
    except UserTopic.DoesNotExist:
        return 404, {"message": "UserTopic not found for the specified topic."}

@router.get(
    "/received-requests",
    summary="受信した師匠選択リクエスト一覧を取得",
    response={200: list, 400: dict},
    auth=JWTAuth(),
)
def get_received_mentor_requests(request: HttpRequest):
    """
    現在のユーザーが受信した師匠選択リクエスト一覧を取得します。
    """
    try:
        requests = MentorRelationRequest.objects.filter(
            to_user=request.user,
            status="pending"
        ).select_related('from_user', 'topic').order_by('-created_at')
        
        request_list = []
        for req in requests:
            request_list.append({
                "id": req.id,
                "from_user": {
                    "id": req.from_user.id,
                    "username": req.from_user.username,
                    "first_name": req.from_user.first_name,
                    "last_name": req.from_user.last_name,
                },
                "topic": {
                    "id": str(req.topic.id),
                    "title": req.topic.title,
                },
                "created_at": req.created_at,
                "status": req.status
            })
        
        return request_list
    except Exception as e:
        return 400, {"message": f"Error retrieving requests: {str(e)}"}

@router.get(
    "/available-mentors/{topic_id}",
    summary="師匠選択可能なユーザーリストを取得",
    response={200: list[UserEasyOut], 400: dict, 404: dict},
    auth=JWTAuth(),
)
def get_available_mentors(request: HttpRequest, topic_id: str):
    """
    指定されたトピックで師匠選択可能なユーザーリストを取得します。
    UserTopicのstatusに基づいて制限を適用します。
    """
    try:
        user_topic = UserTopic.objects.get(user=request.user, topic_id=topic_id)
        
        # 基本条件：自分以外のユーザーで、同じトピックに参加している
        available_users = User.objects.filter(
            usertopic__topic_id=topic_id
        ).exclude(id=request.user.id)
        
        # 師匠は弟子より高いレベルでなければならない
        available_users = available_users.filter(
            usertopic__topic_id=topic_id,
            usertopic__level__gt=user_topic.level
        )
        
        # 既に師弟関係にあるユーザーを除外
        existing_mentors = MentorRelation.objects.filter(
            mentee=request.user, topic_id=topic_id
        ).values_list('mentor_id', flat=True)
        available_users = available_users.exclude(id__in=existing_mentors)
        
        # 保留中のリクエストを送信済みユーザーを除外
        pending_requests = MentorRelationRequest.objects.filter(
            from_user=request.user, topic_id=topic_id, status="pending"
        ).values_list('to_user_id', flat=True)
        available_users = available_users.exclude(id__in=pending_requests)
        
        return [
            UserEasyOut(id=user.id, username=user.username)
            for user in available_users
        ]
        
    except UserTopic.DoesNotExist:
        return 404, {"message": "UserTopic not found for the specified topic."}


@router.get(
    "/mentees/{topic_id}",
    summary="師匠の弟子一覧を取得",
    response={200: list[MenteeInfoOut], 400: dict, 404: dict},
    auth=JWTAuth(),
)
def get_mentees(request: HttpRequest, topic_id: str):
    """
    指定されたトピックでの師匠の弟子一覧を取得します。
    """
    try:
        # 師匠の弟子関係を取得
        mentee_relations = MentorRelation.objects.filter(
            mentor=request.user, topic_id=topic_id
        ).select_related('mentee')
        
        mentee_list = []
        for relation in mentee_relations:
            mentee = relation.mentee
            try:
                user_topic = UserTopic.objects.get(user=mentee, topic_id=topic_id)
                mentee_list.append(MenteeInfoOut(
                    id=mentee.id,
                    username=mentee.username,
                    first_name=mentee.first_name or "",
                    last_name=mentee.last_name or "",
                    level=user_topic.level,
                    created_at=relation.created_at.isoformat()
                ))
            except UserTopic.DoesNotExist:
                # UserTopicが存在しない弟子はスキップ
                continue
        
        return mentee_list
        
    except Exception as e:
        return 400, {"message": f"Error retrieving mentees: {str(e)}"}


@router.get(
    "/capacity/{topic_id}",
    summary="師匠の定員情報を取得",
    response={200: dict, 400: dict, 404: dict},
    auth=JWTAuth(),
)
def get_mentor_capacity(request: HttpRequest, topic_id: str):
    """
    指定されたトピックでの師匠の定員情報を取得します。
    """
    try:
        is_within_capacity, current_count, capacity = _check_mentor_capacity(
            request.user, topic_id
        )
        
        return {
            "current_count": current_count,
            "capacity": capacity,
            "is_within_capacity": is_within_capacity,
            "remaining_slots": max(0, capacity - current_count)
        }
        
    except Exception as e:
        return 400, {"message": f"Error retrieving capacity: {str(e)}"}


@router.post(
    "/no-mentor-selection/{topic_id}",
    summary="師匠選択をしない（最高レベル+1に設定）",
    response={200: dict, 400: dict, 404: dict},
    auth=JWTAuth(),
)
@transaction.atomic
def no_mentor_selection(request: HttpRequest, topic_id: str):
    """
    師匠選択をしない場合、そのトピックの最高レベル+1にレベルを設定します。
    """
    try:
        user_topic = UserTopic.objects.get(user=request.user, topic_id=topic_id)
        
        # そのトピックの最高レベルを取得
        max_level = UserTopic.objects.filter(topic_id=topic_id).aggregate(
            max_level=models.Max('level')
        )['max_level']
        
        # 最高レベル+1に設定（最高レベルがNoneの場合は1に設定）
        new_level = (max_level or 0) + 1
        user_topic.level = new_level
        user_topic.status = UserTopic.Status.ACTIVE
        user_topic.save()
        
        return {
            "new_level": new_level
        }
        
    except UserTopic.DoesNotExist:
        return 404, {"message": "UserTopic not found for the specified topic."}
    except Exception as e:
        return 400, {"message": f"Error setting level: {str(e)}"}

