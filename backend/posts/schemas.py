from ninja import Schema
from datetime import datetime
from typing import List

# レスポンスでメディア情報を返すためのスキーマ
class PostMediaOut(Schema):
    media_type: str
    file: str

# レスポンスで投稿情報を返すためのスキーマ
class PostOut(Schema):
    id: int
    content: str
    created_at: datetime
    media: List[PostMediaOut] # メディアをリストとして含める