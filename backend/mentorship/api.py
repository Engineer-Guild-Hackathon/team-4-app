from typing import List
from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.http import HttpRequest
from django.db import transaction
from ninja import Body # Import Body

User = get_user_model()

# --- スキーマ定義 ---

class Message(Schema):
    """シンプルなメッセージレスポンス用スキーマ"""
    message: str

class MentorRequestIn(Schema):
    """弟子入りリクエストの入力スキーマ"""
    to_user_id: int

class UserSchema(Schema):
    """簡易的なユーザー情報スキーマ"""
    id: int
    username: str

class MentorRequestOut(Schema):
    """弟子入りリクエストの出力スキーマ"""
    id: int
    from_user: UserSchema
    to_user: UserSchema
    status: str

# --- APIエンドポイント定義 ---

def get_mentorship_router():
    from .models import MentorRelationRequest, MentorRelation # Moved import inside function

    router = Router(tags=["mentorship"])

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
        mentor_request = MentorRelationRequest.objects.create(
            from_user=from_user,
            to_user=to_user
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

        # 師匠のランクを取得（存在しない場合はデフォルト値100）
        try:
            mentor_rank = MentorRelation.objects.get(mentee=mentor_request.to_user).rank
        except MentorRelation.DoesNotExist:
            mentor_rank = 100

        # 新しい弟子のランクを計算
        new_mentee_rank = mentor_rank - 10

        # 師弟関係を作成
        MentorRelation.objects.create(
            mentor=mentor_request.to_user,
            mentee=mentor_request.from_user,
            rank=new_mentee_rank
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

    return router
