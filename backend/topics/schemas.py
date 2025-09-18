import typing
from ninja import Schema
from pydantic import Field
from datetime import datetime
from typing import Optional, List
import uuid


class TopicCreateIn(Schema):
    title: str = Field(..., max_length=200)
    description: Optional[str] = Field("", max_length=100)


class TopicUpdateIn(Schema):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=100)


class TopicOut(Schema):
    id: uuid.UUID
    title: str
    description: str
    created_at: datetime
    updated_at: datetime


class MyTopicOut(Schema):
    """参加中のトピック情報（弟子定員を含む）"""
    id: uuid.UUID
    title: str
    description: str
    created_at: datetime
    updated_at: datetime
    mentee_capacity: int
    last_seen_at: Optional[datetime] = None




class TopicListOut(Schema):
    topics: list[TopicOut]
    count: int


class MyTopicListOut(Schema):
    topics: list[MyTopicOut]
    count: int


class UserTopicCreateIn(Schema):
    """ユーザーをトピックに参加させるスキーマ"""

    user_id: int
    level: Optional[int] = 1


class JoinTopicIn(Schema):
    """トピック参加時のスキーマ"""

    level: Optional[int] = 1
    mentor_id: Optional[int] = None


class UserTopicUpdateIn(Schema):
    """ユーザーのトピック参加レベルを更新するスキーマ"""

    level: int


class MenteeCapacityUpdateIn(Schema):
    """弟子定員を更新するスキーマ"""

    mentee_capacity: int  # 1-100の範囲


class UserTopicOut(Schema):
    """ユーザーとトピックの関連情報スキーマ"""

    id: int
    user_id: int
    username: str
    topic_id: uuid.UUID
    topic_title: str
    level: int
    status: str
    created_at: datetime
    updated_at: datetime


class TreeUserOut(Schema):
    """ツリー表示で使う、簡潔なユーザー情報"""

    id: int
    username: str
    avatar: Optional[str] = None


class TreeUserNodeOut(Schema):
    """TreeViewerコンポーネントが期待するノードの形"""

    user: TreeUserOut
    level: int
    mentor_id: Optional[int] = None


class TreeOut(Schema):
    """/tree/ エンドポイントの最終的なレスポンスの形"""

    tree: List[TreeUserNodeOut]
    max_level: int
    min_level: int

#--------予選時点未使用-----------------------
class UserForTreeScructure(Schema):
    user: typing.Any  # 実際の型はUserOutだが循環import回避のためAny
    level: int
    parent_id: Optional[int] = None


class TreeStructureOut(Schema):
    users: List[UserForTreeScructure]
    max_level: int
    min_level: int
