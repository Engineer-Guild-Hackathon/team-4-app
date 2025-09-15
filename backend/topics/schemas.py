import typing
from ninja import Schema
from datetime import datetime
from typing import Optional, List
import uuid


class TopicCreateIn(Schema):
    title: str
    description: Optional[str] = ""


class TopicUpdateIn(Schema):
    title: Optional[str] = None
    description: Optional[str] = None


class TopicOut(Schema):
    id: uuid.UUID
    title: str
    description: str
    created_at: datetime
    updated_at: datetime


class TopicListOut(Schema):
    topics: list[TopicOut]
    count: int


class UserTopicCreateIn(Schema):
    """ユーザーをトピックに参加させるスキーマ"""

    user_id: int
    level: Optional[int] = 1


class UserTopicUpdateIn(Schema):
    """ユーザーのトピック参加レベルを更新するスキーマ"""

    level: int


class UserTopicOut(Schema):
    """ユーザーとトピックの関連情報スキーマ"""

    id: int
    user_id: int
    username: str
    topic_id: uuid.UUID
    topic_title: str
    level: int
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