from typing import List
from ninja import Router, Schema
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import MentorRelationRequest, MentorRelation
from django.http import HttpRequest

# django-ninjaのルーターを作成
router = Router(tags=["mentorship"])

User = get_user_model()

# --- スキーマ定義 ---

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

@router.post("/request", response=MentorRequestOut, summary="弟子入りリクエストを作成する")
def create_mentor_request(request: HttpRequest, payload: MentorRequestIn):
    """
    指定したユーザーに弟子入りリクエストを送信します。

    - 認証が必要です。
    - 自分自身にリクエストを送ることはできません。
    - 既に師弟関係にある、またはリクエスト中のユーザーには再度リクエストできません。
    """
    from_user = request.user
    to_user = get_object_or_404(User, id=payload.to_user_id)

    # 自分自身へのリクエストを禁止
    if from_user == to_user:
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
