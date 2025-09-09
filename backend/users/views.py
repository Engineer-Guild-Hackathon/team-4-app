from .schemas import UserIn, UserOut, UserWithTopicsSchema
from ninja import Router
from django.contrib.auth import get_user_model
from ninja_jwt.authentication import JWTAuth
from ninja_jwt.tokens import RefreshToken

User = get_user_model()

router = Router(tags=["users"])

@router.get("/", response=list[UserOut], auth=JWTAuth())
def list_users(request):
    return User.objects.all()

@router.get("/{user_id}/", response=UserOut, auth=JWTAuth())
def get_user(request, user_id: int):
    return User.objects.get(id=user_id)


@router.get("/{user_id}/topics/", response=UserWithTopicsSchema, auth=JWTAuth())
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

@router.post("/", response={201: UserOut}, auth=JWTAuth())

def create_user(request, data: UserIn):
    user = User.objects.create_user(
        username=data.username,
        email=data.email,
        password=data.password
    )
    # JWTトークン生成
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    return {
        "access": access,
        "refresh": str(refresh),
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
        }
    }

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
