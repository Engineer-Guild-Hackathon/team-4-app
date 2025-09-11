from ninja import Schema
from datetime import datetime
from typing import List
from .models import Post

# レスポンスでメディア情報を返すためのスキーマ
class PostMediaOut(Schema):
    media_type: str
    file: str

# レスポンスで投稿情報を返すためのスキーマ
class PostOut(Schema):
    id: int
    content: str
    created_at: datetime
    media: List[PostMediaOut]

    # 'media'フィールドを解決するためのリゾルバ
    @staticmethod
    def resolve_media(obj: Post) -> List[PostMediaOut]:
        # postオブジェクト(obj)に紐づく全てのmediaをリストにして返す
        return list(obj.media.all())