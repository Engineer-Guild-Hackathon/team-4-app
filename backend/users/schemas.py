from ninja import Schema, ModelSchema
from django.contrib.auth import get_user_model
from typing import List
from topics.schemas import TopicOut

User = get_user_model()

class UserOut(ModelSchema):
    class Config:
        model = User
        model_fields = ["id", "username", "is_active", "is_staff"]

class UserCreateOut(Schema):
    access: str
    refresh: str
    user: UserOut

class UserWithTopicsOut(Schema):
    id: int
    username: str
    email: str
    is_active: bool
    is_staff: bool
    topics: List[TopicOut]

class UserIn(Schema):
    username: str
    email: str
    password: str
