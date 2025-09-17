from django.contrib.auth import get_user_model
from typing import List, Optional

from ninja import ModelSchema, Schema
from topics.schemas import TopicOut

User = get_user_model()

class UserOut(ModelSchema):
    avatar: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        model = User
        model_fields = ["id", "username", "is_active", "is_staff"]

    @staticmethod
    def resolve_avatar(obj):
        if hasattr(obj, 'profile') and obj.profile.avatar:
            return obj.profile.avatar.url
        return None

    @staticmethod
    def resolve_bio(obj):
        if hasattr(obj, 'profile'):
            return obj.profile.bio
        return None
    
class UserDetail(ModelSchema):
    blocking: bool   # 自分がこのユーザーにブロックされているか
    blocked: bool   # このユーザーが自分をブロックしているか

    avatar: Optional[str] = None
    bio: Optional[str] = None

    class Config:
        model = User
        model_fields = ["id", "username", "is_active", "is_staff"]

class UserCreateOut(Schema):
    access: str
    refresh: str
    user: UserOut

class UserWithTopicsOut(UserOut):
    topics: List[TopicOut]

class UserIn(Schema):
    username: str
    email: str
    password: str

class UserProfileUpdateIn(Schema):
    bio: Optional[str] = None

class PasswordResetRequestIn(Schema):
    email: str

class PasswordResetConfirmIn(Schema):
    email: str
    code: str
    new_password: str

class PasswordResetResponseOut(Schema):
    message: str