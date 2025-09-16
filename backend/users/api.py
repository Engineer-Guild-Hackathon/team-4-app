from users.models import Block
from .schemas import UserCreateOut, UserIn, UserOut, UserWithTopicsOut, UserDetail
from ninja import Router
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