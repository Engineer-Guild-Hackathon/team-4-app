from ninja import Schema
from datetime import datetime
from typing import List
from .models import Post

class AuthorSchema(Schema):
    id: int
    username: str

class PostMediaOut(Schema):
    media_type: str
    file: str

class PostOut(Schema):
    id: int
    content: str
    created_at: datetime
    author: AuthorSchema
    media: List[PostMediaOut]

    @staticmethod
    def resolve_media(obj: Post) -> List[PostMediaOut]:

        return list(obj.media.all())