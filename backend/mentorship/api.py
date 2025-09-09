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
    id: uuid.UUID
    title: str

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

# --- APIエンドポイント定義 ---

def get_mentorship_router():
    from .models import MentorRelationRequest, MentorRelation, ActionLog 

    router = Router(tags=["mentorship"])

    def _remove_relation(mentor, mentee, action: str):
        """
        指定されたメンターと弟子の関係を削除し、アクションログを記録します。
        """
        relation = get_object_or_404(MentorRelation, mentor=mentor, mentee=mentee)
        relation.delete()

        # ログを記録
        ActionLog.objects.create(actor=mentor, target=mentee, action=action)

        return {"status": action, "mentee_id": mentee.id}

    def update_subtree_ranks(user: User, rank_difference: int):
        """
        指定されたユーザーとその配下の弟子全員のランクを更新します。
        再帰CTEを使用して、効率的にサブツリー全体のランクを更新します。
        """
        with connection.cursor() as cursor:
            # PostgreSQLの再帰CTEを使用してサブツリー内の全ユーザーIDを取得し、ランクを更新
            cursor.execute("""
                WITH RECURSIVE subtree AS (
                    -- アンカーメンバー: 初期ユーザー
                    SELECT id
                    FROM users_user
                    WHERE id = %s

                    UNION ALL

                    -- 再帰メンバー: サブツリー内のユーザーの弟子を見つける
                    SELECT u.id
                    FROM users_user u
                    JOIN mentorship_mentorrelation mr ON u.id = mr.mentee_id
                    JOIN subtree s ON mr.mentor_id = s.id
                )
                UPDATE users_user
                SET rank = rank + %s
                WHERE id IN (SELECT id FROM subtree);
            """, [user.id, rank_difference])

    @router.get("/mentors/{mentor_id}/subtree", response=List[MenteeSubtreeOut], summary="指定されたメンターの弟子ツリーを取得する")
    def get_mentor_subtree(request: HttpRequest, mentor_id: int):
        """
        指定されたメンターの全ての弟子（サブツリー）を取得します。
        """
        subtree = MentorRelation.objects.get_mentee_subtree(mentor_id)
        return subtree

    @router.post("/promote", response={200: Message, 403: Message, 404: Message}, summary="ユーザーとそのサブツリーのランクを更新する")
    @transaction.atomic
    def promote_user(request: HttpRequest, payload: PromoteUserIn):
        """
        指定されたユーザーとその配下の弟子全員のランクを更新します。
        """
        target_user = get_object_or_404(User, id=payload.user_id)
        # スーパーユーザーまたはユーザー自身のみが昇格/降格を許可される
        if not request.user.is_superuser and request.user.id != target_user.id:
            return 403, {"message": "You do not have permission to perform this action."}
        update_subtree_ranks(target_user, payload.rank_difference)
        return {"message": f"Rank of {target_user.username} and their subtree updated by {payload.rank_difference}."}

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

        # 弟子追加時：mentee.rank = mentor.rank - 10
        mentee.rank = mentor.rank - 10
        mentee.save()

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

    @router.post("/mentees/{mentee_id}/graduate", response={200: MenteeActionStatus, 404: Message}, summary="弟子を卒業させる")
    def graduate_mentee(request: HttpRequest, mentee_id: int):
        """
        自身の弟子を卒業させ、師弟関係を解消します。

        - 認証が必要です。
        - 指定されたIDのユーザーが、実行者の弟子である必要があります。
        """

        mentee = get_object_or_404(User, id=mentee_id)
        return _remove_relation(request.user, mentee, "graduate")

    @router.post("/mentees/{mentee_id}/expel", response={200: MenteeActionStatus, 404: Message}, summary="弟子を破門する")
    def expel_mentee(request: HttpRequest, mentee_id: int):
        """
        自身の弟子を破門し、師弟関係を解消します。

        - 認証が必要です。
        - 指定されたIDのユーザーが、実行者の弟子である必要があります。
        """
        
        mentee = get_object_or_404(User, id=mentee_id)
        return _remove_relation(request.user, mentee, "expel")

    return router