from ninja import Schema, ModelSchema
from django.contrib.auth import get_user_model
from typing import List
from topics.schemas import TopicResponseSchema

User = get_user_model()

class UserOut(ModelSchema):
    class Config:
        model = User
        model_fields = ["id", "username", "email", "is_active", "is_staff"]

class UserCreateResponse(Schema):
    access: str
    refresh: str
    user: UserOut

class UserWithTopicsSchema(Schema):
    id: int
    username: str
    email: str
    is_active: bool
    is_staff: bool
    topics: List[TopicResponseSchema]

class UserIn(Schema):
    username: str
    email: str
    password: str
