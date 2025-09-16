from ninja import Schema, ModelSchema
from django.contrib.auth import get_user_model
from typing import List, Optional
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

class UserCreateOut(Schema):
    access: str
    refresh: str
    user: UserOut

class UserWithTopicsOut(Schema):
    id: int
    username: str
    is_active: bool
    is_staff: bool
    topics: List[TopicOut]

class UserIn(Schema):
    username: str
    email: str
    password: str