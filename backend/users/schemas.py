from ninja import Schema, ModelSchema
from django.contrib.auth import get_user_model

User = get_user_model()

class UserOut(ModelSchema):
    class Config:
        model = User
        model_fields = ["id", "username", "email", "is_active", "is_staff"]

class UserIn(Schema):
    username: str
    email: str
    password: str
