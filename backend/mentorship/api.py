import uuid
from typing import List
from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from django.db import connection, transaction
from ninja import Body 
from topics.models import Topic

User = get_user_model()

# --- スキーマ定義 ---

class Message(Schema):
    """シンプルなメッセージレスポンス用スキーマ"""
    message: str

class TopicSchema(Schema):
    """トピック情報スキーマ"""
    """トピック情報スキーマ"""
    id: uuid.UUID
    title: str

class TopicId(Schema):
    """トピックidスキーマ"""
    topic_id: uuid.UUID

class MentorRequestIn(Schema):
    """弟子入りリクエストの入力スキーマ"""
    to_user_id: int
    topic_id: str

class UserSchema(Schema):
    """簡易的なユーザー情報スキーマ"""
    id: int
    username: str

class MentorRequestOut(Schema):
    """弟子入りリクエストの出力スキーマ"""
    id: int
    from_user: UserSchema
    to_user: UserSchema
    topic: TopicSchema
    status: str

class MenteeActionStatus(Schema):
    """弟子に対するアクションのステータスレスポンススキーマ"""
    """弟子に対するアクションのステータスレスポンススキーマ"""
    status: str
    mentee_id: int

class PromoteUserIn(Schema):
    """ユーザー昇格/降格の入力スキーマ"""
    user_id: int
    rank_difference: int

class MenteeSubtreeOut(Schema):
    """メンターの弟子ツリー情報スキーマ"""
    id: int
    username: str
    email: str
    level: int

class UserNodeOut(Schema):
    user: UserSchema
    rank: int
    mentor_id: int | None = None

# --- APIエンドポイント定義 ---
def get_mentorship_router():
    from .models import MentorRelationRequest, MentorRelation, ActionLog 

    user_table = User._meta.db_table

    router = Router(tags=["mentorship"])

    def _remove_relation(relation: MentorRelation, action: str):
        """
        指定された師弟関係を削除し、アクションログを記録します。
        """
        mentee_id = relation.mentee.id
        actor = relation.mentor
        target = relation.mentee
        relation.delete()

        # ログを記録
        ActionLog.objects.create(actor=actor, target=target, action=action)

        return {"status": action, "mentee_id": mentee_id}

    def update_subtree_ranks(user: User, rank_difference: int):
        """
        指定されたユーザーとその配下の弟子全員のランクを更新します。
        再帰CTEを使用して、効率的にサブツリー全体のランクを更新します。
        """
        with connection.cursor() as cursor:
            # PostgreSQLの再帰CTEを使用してサブツリー内の全ユーザーIDを取得し、ランクを更新
            cursor.execute(f"""
                WITH RECURSIVE subtree AS (
                    -- アンカーメンバー: 初期ユーザー
                    SELECT id
                    FROM {user_table}
                    WHERE id = %s

                    UNION ALL

                    -- 再帰メンバー: サブツリー内のユーザーの弟子を見つける
                    SELECT u.id
                    FROM {user_table} u
                    JOIN mentorship_mentorrelation mr ON u.id = mr.mentee_id
                    JOIN subtree s ON mr.mentor_id = s.id
                )
                UPDATE {user_table}
                SET rank = rank + %s
                WHERE id IN (SELECT id FROM subtree);
            """, [user.id, rank_difference])

    def update_descendant_levels(user: User, topic_id: uuid.UUID, level_difference: int):
        """
        指定されたユーザーの配下の弟子全員（子孫）の特定のトピックのレベルを更新します。
        """
        with connection.cursor() as cursor:
            cursor.execute(f"""
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
            """, [user.id, level_difference, user.id, topic_id])



    @router.get("/mentors/{mentor_id}/subtree", response=List[MenteeSubtreeOut], summary="指定されたメンターの弟子ツリーを取得する")
    def get_mentor_subtree(request: HttpRequest, mentor_id: int):
        """
        指定されたメンターの全ての弟子（サブツリー）を取得します。
        """
        subtree = MentorRelation.objects.get_mentee_subtree(mentor_id)
        return subtree

    @router.get("/tree/", response=List[UserNodeOut], summary="全てのユーザーと師弟関係のツリーデータを取得する")
    def get_tree_data(request: HttpRequest):
        """
        全てのユーザーと、それぞれのユーザーのランク、師匠のIDを含むツリーデータを取得します。
        """
        users = User.objects.all()
        mentor_relations = MentorRelation.objects.all().select_related('mentor', 'mentee')
        print(f"mentor_relations: {mentor_relations}")

        # Create a dictionary to quickly look up mentor_id by mentee_id
        mentee_to_mentor = {relation.mentee.id: relation.mentor.id for relation in mentor_relations}
        print(f"mentee_to_mentor: {mentee_to_mentor}")

        data = []
        for user in users:
            mentor_id = mentee_to_mentor.get(user.id) # Get mentor_id if user is a mentee

            data.append(UserNodeOut(
                user=UserSchema(id=user.id, username=user.username),
                rank=user.rank,
                mentor_id=mentor_id
            ))
        return data

    @router.post("/request", response={200: MentorRequestOut, 400: Message}, summary="弟子入りリクエストを作成する")
    def create_mentor_request(request: HttpRequest, payload: MentorRequestIn):
        """
        指定したユーザーに弟子入りリクエストを送信します。

        - 認証が必要です。
        - 自分自身にリクエストを送ることはできません。
        - 既に師弟関係にある、またはリクエスト中のユーザーには再度リクエストできません。
        """
        from_user = request.user # Changed to request.user
        to_user = get_object_or_404(User, id=payload.to_user_id)

        # 自分自身へのリクエストを禁止
        if from_user.id == to_user.id:
            return 400, {"message": "You cannot send a mentor request to yourself."}

        # 既存の関係やリクエストをチェック
        if MentorRelation.objects.filter(mentee=from_user, mentor=to_user).exists():
            return 400, {"message": "You are already in a mentorship with this user."}
        if MentorRelationRequest.objects.filter(from_user=from_user, to_user=to_user, status='pending').exists():
            return 400, {"message": "A pending request to this user already exists."}

        # リクエストを作成
        topic = get_object_or_404(Topic, id=payload.topic_id)
        mentor_request = MentorRelationRequest.objects.create(
            from_user=from_user,
            to_user=to_user,
            topic=topic
        )
        return mentor_request

    @router.post("/requests/{request_id}/approve", response={200: Message, 403: Message, 404: Message}, summary="弟子入りリクエストを承認する")
    @transaction.atomic
    def approve_mentor_request(request: HttpRequest, request_id: int):
        """
        受け取った弟子入りリクエストを承認します。

        - リクエストの宛先（to_user）である本人しか承認できません。
        - 承認されると、リクエストのステータスが `approved` になり、新しい師弟関係が作成されます。
        """
        mentor_request = get_object_or_404(MentorRelationRequest, id=request_id, status='pending')

        # リクエストの宛先本人かチェック
        if request.user.id != mentor_request.to_user.id:
            return 403, {"message": "You do not have permission to perform this action."}

        # 師弟関係を作成
        mentor = mentor_request.to_user
        mentee = mentor_request.from_user
        MentorRelation.objects.create(
            mentor=mentor,
            mentee=mentee,
            topic=mentor_request.topic
        )

        # リクエストのステータスを更新
        mentor_request.status = MentorRelationRequest.Status.APPROVED
        mentor_request.save()

        return {"message": "Request approved successfully."}


    @router.post("/requests/{request_id}/reject", response={200: Message, 403: Message, 404: Message}, summary="弟子入りリクエストを拒否する")
    def reject_mentor_request(request: HttpRequest, request_id: int):
        """
        受け取った弟子入りリクエストを拒否します。

        - リクエストの宛先（to_user）である本人しか拒否できません。
        """
        mentor_request = get_object_or_404(MentorRelationRequest, id=request_id, status='pending')

        # リクエストの宛先本人かチェック
        if request.user.id != mentor_request.to_user.id:
            return 403, {"message": "You do not have permission to perform this action."}

        # リクエストのステータスを更新
        mentor_request.status = MentorRelationRequest.Status.REJECTED
        mentor_request.save()

        return {"message": "Request rejected successfully."}

    @router.post("/mentees/{mentee_id}/expel", response={200: MenteeActionStatus, 404: Message}, summary="弟子を破門する")
    def expel_mentee(request: HttpRequest, mentee_id: int, data: TopicId):
        """
        自身の弟子を破門し、師弟関係を解消します。

        - 認証が必要です。
        - 指定されたIDのユーザーが、実行者の弟子である必要があります。
        """
        
        mentorship = get_object_or_404(
            MentorRelation,
            mentor=request.user,
            mentee_id=mentee_id,
            topic_id=data.topic_id)
        return _remove_relation(mentorship, action="expel")

    @router.post("/mentees/{mentee_id}/graduate", response={200: MenteeActionStatus, 404: Message}, summary="弟子を卒業させる")
    def graduate_mentee(request: HttpRequest, mentee_id: int, data: TopicId):
        """
        自身の弟子を卒業させ、師弟関係を解消します。

        - 認証が必要です。
        - 指定されたIDのユーザーが、実行者の弟子である必要があります。
        """
        mentorship = get_object_or_404(
            MentorRelation,
            mentor=request.user,
            mentee_id=mentee_id,
            topic_id=data.topic_id)
        mentee = mentorship.mentee
        delta = request.user.usertopic_set.get(topic_id=data.topic_id).level - mentee.usertopic_set.get(topic_id=data.topic_id).level
        user_topic = mentee.usertopic_set.get(topic_id=data.topic_id)
        user_topic.level += delta
        user_topic.save()
        # menteeの子孫のUserTopicのlevelを更新
        update_descendant_levels(mentee, data.topic_id, delta)
        return _remove_relation(mentorship, action="graduate")

    return router
# Added a comment to force reload