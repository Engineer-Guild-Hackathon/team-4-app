import uuid
from typing import List
from ninja import Router
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from django.db import connection, transaction
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
from topics.models import Topic
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
)
def create_mentor_request(request: HttpRequest, payload: MentorRequestIn):
    """
    弟子の数が定員に達しているユーザーに対して弟子入りリクエストを送信します。

    - 認証が必要です。
    - 自分自身にリクエストを送ることはできません。
    - 既に師弟関係にある、またはリクエスト中のユーザーには再度リクエストできません。
    """
    from_user = request.user  # Changed to request.user
    to_user = get_object_or_404(User, id=payload.to_user_id)

    # 自分自身へのリクエストを禁止
    if from_user.id == to_user.id:
        return 400, {"message": "You cannot send a mentor request to yourself."}

    # 既存の関係やリクエストをチェック
    if MentorRelation.objects.filter(mentee=from_user, mentor=to_user).exists():
        return 400, {"message": "You are already in a mentorship with this user."}
    if MentorRelationRequest.objects.filter(
        from_user=from_user, to_user=to_user, status="pending"
    ).exists():
        return 400, {"message": "A pending request to this user already exists."}

    # リクエストを作成
    topic = get_object_or_404(Topic, id=payload.topic_id)
    mentor_request = MentorRelationRequest.objects.create(
        from_user=from_user, to_user=to_user, topic=topic
    )
    return mentor_request


# 阿部TODO: リクエストが来る→定員に達しているので、既存の弟子を破門or卒業させる→弟子が新しく入る。の流れを実装する
@router.post(
    "/requests/{request_id}/approve",
    response={200: ErrorOut, 403: ErrorOut, 404: ErrorOut},
    summary="弟子入りリクエストを承認する",
)
@transaction.atomic
def approve_mentor_request(request: HttpRequest, request_id: int):
    """
    受け取った弟子入りリクエストを承認します。

    - リクエストの宛先（to_user）である本人しか承認できません。
    - 承認されると、リクエストのステータスが `approved` になり、新しい師弟関係が作成されます。
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

    # リクエストのステータスを更新
    mentor_request.status = MentorRelationRequest.Status.APPROVED
    mentor_request.save()

    return {"message": "Request approved successfully."}


@router.post(
    "/requests/{request_id}/reject",
    response={200: ErrorOut, 403: ErrorOut, 404: ErrorOut},
    summary="弟子入りリクエストを拒否する",
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
    return _remove_relation(mentorship, action="expel")


# 阿部TODO: 現時点は弟子と同レベルであることを想定しているが、弟子の方が高レベルの場合、delta + 1とし、元師匠より1レベル高くさせる
@router.post(
    "/mentees/{mentee_id}/graduate",
    response={200: MenteeActionStatusOut, 404: ErrorOut},
    summary="弟子を卒業させる",
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
    user_topic.save()
    # menteeの子孫のUserTopicのlevelを更新
    _update_descendant_levels(mentee, data.topic_id, delta)
    return _remove_relation(mentorship, action="graduate")


# ---------予選通過時点で未使用---------------------------------------------------------------------------------
@router.get(
    "/mentors/{mentor_id}/subtree",
    response=List[MenteeSubtreeOut],
    summary="指定されたメンターの弟子ツリーを取得する",
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
)
def get_tree_data(request: HttpRequest):
    """
    全てのユーザーと、それぞれのユーザーのランク、師匠のIDを含むツリーデータを取得します。
    """
    users = User.objects.all()
    mentor_relations = MentorRelation.objects.all().select_related("mentor", "mentee")

    # Create a dictionary to quickly look up mentor_id by mentee_id
    mentee_to_mentor = {
        relation.mentee.id: relation.mentor.id for relation in mentor_relations
    }

    data = []
    for user in users:
        mentor_id = mentee_to_mentor.get(user.id)  # Get mentor_id if user is a mentee

        data.append(
            UserNodeOut(
                user=UserEasyOut(id=user.id, username=user.username),
                rank=user.rank,
                mentor_id=mentor_id,
            )
        )
    return data
