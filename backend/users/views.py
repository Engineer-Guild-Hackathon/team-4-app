from .schemas import UserIn, UserOut
from ninja import Router
from django.contrib.auth import get_user_model
from ninja_jwt.authentication import JWTAuth

User = get_user_model()

router = Router(tags=["users"])

@router.get("/", response=list[UserOut], auth=JWTAuth())
def list_users(request):
    return User.objects.all()

@router.get("/{user_id}/", response=UserOut, auth=JWTAuth())
def get_user(request, user_id: int):
    return User.objects.get(id=user_id)

@router.post("/", response={201: UserOut}, auth=JWTAuth())
def create_user(request, data: UserIn):
    user = User.objects.create_user(
        username=data.username,
        email=data.email,
        password=data.password
    )
    return user

@router.put("/{user_id}/", response=UserOut, auth=JWTAuth())
def update_user(request, user_id: int, data: UserIn):
    user = User.objects.get(id=user_id)
    user.username = data.username
    user.email = data.email
    if data.password:
        user.set_password(data.password)
    user.save()
    return user

@router.delete("/{user_id}/", auth=JWTAuth(), response={204: None})
def delete_user(request, user_id: int):
    user = User.objects.get(id=user_id)
    user.delete()
    return {"success": True}
