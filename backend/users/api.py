from .schemas import UserCreateOut, UserIn, UserOut, UserWithTopicsOut
from ninja import Router, Form, File
from typing import Optional
from ninja.files import UploadedFile
from .models import UserProfile
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken

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
    
@router.get("/{user_id}/", response=UserOut, auth=JWTAuth())
def get_user(request, user_id: int):
    user = get_object_or_404(User.objects.select_related('profile'), id=user_id)
    return user


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