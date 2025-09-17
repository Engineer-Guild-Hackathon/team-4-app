from ninja import Router, Form, File
from typing import Optional
from ninja.files import UploadedFile
from users.models import Block
from .models import UserProfile
from .schemas import (
    UserCreateOut, UserIn, UserOut, UserWithTopicsOut, UserDetail,
    PasswordResetRequestIn, PasswordResetConfirmIn, PasswordResetResponseOut
)
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken
import random
import string
from django.core.cache import cache

User = get_user_model()

router = Router(tags=["users"])

@router.get("/", response=list[UserOut], auth=JWTAuth())
def list_users(request):
    return User.objects.all()

@router.get("/me/", response=UserOut, auth=JWTAuth())
def get_current_user(request):
    """現在のユーザー情報を取得する"""
    user = get_object_or_404(User.objects.select_related('profile'), id=request.auth.id)
    return user

@router.post("/password-reset/", response={200: PasswordResetResponseOut, 400: dict})
def request_password_reset(request, data: PasswordResetRequestIn):
    try:
        user = User.objects.filter(email=data.email).first()
        if not user:
            return PasswordResetResponseOut(message="パスワードリセットコードを送信しました。")
    except Exception:
        return PasswordResetResponseOut(message="パスワードリセットコードを送信しました。")
    
    # 6桁のランダムコード生成
    reset_code = ''.join(random.choices(string.digits, k=6))
    
    # キャッシュに保存（10分間有効）
    cache_key = f"password_reset_{data.email}"
    cache.set(cache_key, reset_code, 600)  # 10分 = 600秒
    
    # メール送信
    subject = "パスワードリセットコードのご案内"
    message = f"""
パスワードリセットコードのご案内

パスワードリセットコード: {reset_code}

このコードをアプリに入力してパスワードをリセットしてください。

※このコードは10分間有効です
※このメールに心当たりがない場合は、無視してください
"""
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception:
        return 400, {"message": "メール送信に失敗しました。しばらく時間をおいて再度お試しください。"}
    
    return PasswordResetResponseOut(message="パスワードリセットコードを送信しました。")

@router.post("/password-reset/confirm/", response={200: PasswordResetResponseOut, 400: dict})
def confirm_password_reset(request, data: PasswordResetConfirmIn):
    try:
        # ユーザーを取得
        user = User.objects.filter(email=data.email).first()
        if not user:
            return 400, {"message": "無効なメールアドレスです。"}
        
        # キャッシュからコードを取得
        cache_key = f"password_reset_{data.email}"
        stored_code = cache.get(cache_key)
        
        if not stored_code:
            return 400, {"message": "コードが期限切れまたは無効です。"}
        
        # コードの検証
        if stored_code != data.code:
            return 400, {"message": "無効なコードです。"}
        
        # パスワード更新
        user.set_password(data.new_password)
        user.save()
        
        # 使用済みコードを削除
        cache.delete(cache_key)
        
        return PasswordResetResponseOut(message="パスワードが正常にリセットされました。")
        
    except Exception:
        return 400, {"message": "パスワードリセットに失敗しました。コードが無効または期限切れの可能性があります。"}

@router.get("/{user_id}/", response={200: UserDetail, 403: dict}, auth=JWTAuth())
def get_user(request, user_id: int):
    user = get_object_or_404(User.objects.select_related('profile'), id=user_id)
    blocked = Block.objects.filter(blocker=user, blocked=request.user).exists()
    blocking = Block.objects.filter(blocker=request.user, blocked=user).exists()
    if blocked:
        return 403, {"message": "You are blocked by this user. Cannot display details."}
    return UserDetail(
        id=user.id,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        is_staff=user.is_staff,
        blocked=blocked,
        blocking=blocking,
    )


@router.get("/{user_id}/topics/", response=UserWithTopicsOut, auth=JWTAuth())
def get_user_with_topics(request, user_id: int):
    user = User.objects.prefetch_related('topics').get(id=user_id)
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "topics": list(user.topics.all())
    }

@router.post("/", response={201: UserCreateOut})
def create_user(request, data: UserIn):
    user = User.objects.create_user(
        username=data.username,
        email=data.email,
        password=data.password
    )
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    return UserCreateOut(
        access=access,
        refresh=str(refresh),
        user=UserOut(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            is_staff=user.is_staff,
        )
    )

@router.put("/{user_id}/", response=UserOut, auth=JWTAuth())
def update_user(request, user_id: int, data: UserIn):
    user = User.objects.get(id=user_id)
    user.username = data.username
    user.email = data.email
    if data.password:
        user.set_password(data.password)
    user.save()
    return user

@router.delete("/{user_id}/", auth=JWTAuth())
def delete_user(request, user_id: int):
    user = User.objects.get(id=user_id)
    user.delete()
    return {"success": True}

@router.post("/me/profile/", response=UserOut, auth=JWTAuth())
def update_my_profile(request,
                      bio: Optional[str] = Form(None), 
                      avatar_file: Optional[UploadedFile] = File(None)):
    """
    ログインしているユーザー自身のプロフィール（bioとアバター）を更新する
    """
    user = request.auth
    profile, created = UserProfile.objects.get_or_create(user=user)

    if bio is not None:
        profile.bio = bio

    if avatar_file:
        profile.avatar = avatar_file
    
    profile.save()

    updated_user = get_object_or_404(User.objects.select_related('profile'), id=user.id)
    return updated_user
@router.post("/{user_id}/block/", response={200: dict, 400: dict, 404: dict}, auth=JWTAuth())
def block_user(request, user_id: int):
    if request.user.id == user_id:
        return 400, {"message": "You cannot block yourself."}
    user_to_block = get_object_or_404(User, id=user_id)
    Block.objects.get_or_create(blocker=request.user, blocked=user_to_block)
    return {"message": f"User {user_to_block.username} has been blocked."}

@router.post("/{user_id}/unblock/", response={200: dict, 400: dict, 404: dict}, auth=JWTAuth())
def unblock_user(request, user_id: int):
    user_to_unblock = get_object_or_404(User, id=user_id)
    Block.objects.filter(blocker=request.user, blocked=user_to_unblock).delete()
    return {"message": f"User {user_to_unblock.username} has been unblocked."}
