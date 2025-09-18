from ninja import Schema
from datetime import datetime
from typing import List
from .models import Post, PostMedia

class AuthorOut(Schema):
    id: int
    username: str
    avatar: str | None = None

    @staticmethod
    def resolve_avatar(obj) -> str | None:
        if obj.profile and obj.profile.avatar:
            return obj.profile.avatar.url
        return None

class PostMediaOut(Schema):
    media_type: str
    file: str

    @staticmethod
    def resolve_file(obj: PostMedia) -> str:
        return obj.file.url

class PostOut(Schema):
    id: int
    content: str
    created_at: datetime
    author: AuthorOut
    media: List[PostMediaOut]

    @staticmethod
    def resolve_media(obj: Post) -> List[PostMediaOut]:

        return list(obj.media.all())