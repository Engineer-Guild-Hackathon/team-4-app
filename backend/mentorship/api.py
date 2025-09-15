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
def create_mentor_request(request: HttpRequest, payload: MentorRequestIn):
    """
    弟子の数が定員に達しているユーザーに対して弟子入りリクエストを送信します。

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

    # リクエストを作成
    mentor_request = MentorRelationRequest.objects.create(
        from_user=from_user, to_user=to_user, topic=topic
    )
    return mentor_request


# 阿部TODO: リクエストが来る→定員に達しているので、既存の弟子を破門or卒業させる→弟子が新しく入る。の流れを実装する
@router.post(
    "/requests/{request_id}/approve",
    response={200: ErrorOut, 403: ErrorOut, 404: ErrorOut},
    summary="弟子入りリクエストを承認する",
    auth=JWTAuth(),
)
@transaction.atomic
def approve_mentor_request(request: HttpRequest, request_id: int):
    """
    受け取った弟子入りリクエストを承認します。

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

    # 師弟関係を作成
    MentorRelation.objects.create(
        mentor=mentor_request.to_user,
        mentee=mentor_request.from_user,
        topic=mentor_request.topic,
    )

    # 弟子のUserTopicのstatusをACTIVEにリセット（師匠選択完了）
    try:
        mentee_user_topic = UserTopic.objects.get(
            user=mentor_request.from_user, 
            topic=mentor_request.topic
        )
        mentee_user_topic.status = UserTopic.Status.ACTIVE
        mentee_user_topic.save()
    except UserTopic.DoesNotExist:
        pass  # UserTopicが存在しない場合はスキップ

    # リクエストのステータスを更新
    mentor_request.status = MentorRelationRequest.Status.APPROVED
    mentor_request.save()

    return {"message": "Request approved successfully."}


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
    
    return _remove_relation(mentorship, action="expel")


# 阿部TODO: 現時点は弟子と同レベルであることを想定しているが、弟子の方が高レベルの場合、delta + 1とし、元師匠より1レベル高くさせる
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
    delta = (
        request.user.usertopic_set.get(topic_id=data.topic_id).level
        - mentee.usertopic_set.get(topic_id=data.topic_id).level
    )
    user_topic = mentee.usertopic_set.get(topic_id=data.topic_id)
    user_topic.level += delta
    # UserTopicのstatusをGRADUATEDに更新
    user_topic.status = UserTopic.Status.GRADUATED
    user_topic.save()
    # menteeの子孫のUserTopicのlevelを更新
    _update_descendant_levels(mentee, data.topic_id, delta)
    return _remove_relation(mentorship, action="graduate")


# ---------予選通過時点で未使用---------------------------------------------------------------------------------
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


@router.post(
    "/mentor-selection/complete",
    summary="師匠選択完了",
    auth=JWTAuth(),
)
def complete_mentor_selection(request: HttpRequest, data: TopicId):
    """
    師匠選択完了時にUserTopicのstatusをACTIVEにリセットします。
    """
    try:
        user_topic = UserTopic.objects.get(user=request.user, topic_id=data.topic_id)
        user_topic.status = UserTopic.Status.ACTIVE
        user_topic.save()
        return {"message": "Mentor selection completed successfully"}
    except UserTopic.DoesNotExist:
        return 400, {"message": "UserTopic not found."}

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
        
        # UserTopicのstatusに基づく制限を適用
        if user_topic.status == UserTopic.Status.GRADUATED:
            # GRADUATEDユーザーは自分のlevel + 1以上の師匠のみ選択可能
            available_users = available_users.filter(
                usertopic__topic_id=topic_id,
                usertopic__level__gt=user_topic.level
            )
        elif user_topic.status == UserTopic.Status.EXPELLED:
            # EXPELLEDユーザーは自分と同レベル以下の師匠のみ選択可能
            available_users = available_users.filter(
                usertopic__topic_id=topic_id,
                usertopic__level__lte=user_topic.level
            )
        # ACTIVEユーザーは制限なし
        
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

