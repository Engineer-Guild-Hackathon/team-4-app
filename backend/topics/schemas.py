import typing
from ninja import Schema
from datetime import datetime
from typing import Optional, List
import uuid


def get_UserOut():
    from users.schemas import UserOut
    return UserOut


class TopicCreateSchema(Schema):
    title: str
    description: Optional[str] = ""


class TopicUpdateSchema(Schema):
    title: Optional[str] = None
    description: Optional[str] = None


class TopicResponseSchema(Schema):
    id: uuid.UUID  
    title: str
    description: str
    created_at: datetime
    updated_at: datetime


class TopicListResponseSchema(Schema):
    topics: list[TopicResponseSchema]
    count: int


class UserTopicCreateSchema(Schema):
    """ユーザーをトピックに参加させるスキーマ"""
    user_id: int
    level: Optional[int] = 1


class UserTopicUpdateSchema(Schema):
    """ユーザーのトピック参加レベルを更新するスキーマ"""
    level: int


class UserTopicResponseSchema(Schema):
    """ユーザーとトピックの関連情報スキーマ"""
    id: int
    user_id: int
    username: str
    topic_id: uuid.UUID
    topic_title: str
    level: int
    created_at: datetime
    updated_at: datetime

class UserForTreeScructure(Schema):
    user: typing.Any  # 実際の型はUserOutだが循環import回避のためAny
    level: int
    parent_id: Optional[int] = None

class TreeStructureOut(Schema):
    users: List[UserForTreeScructure]
    max_level: int
    min_level: int


class TopicUsersResponseSchema(Schema):
    """トピックの参加ユーザー一覧スキーマ"""
    users: List[UserTopicResponseSchema]
    count: int

class TreeUserSchema(Schema):
    """ツリー表示で使う、簡潔なユーザー情報"""
    id: int
    username: str

class TreeUserNodeSchema(Schema):
    """TreeViewerコンポーネントが期待するノードの形"""
    user: TreeUserSchema
    rank: int
    mentor_id: Optional[int] = None

class TreeResponseSchema(Schema):
    """/tree/ エンドポイントの最終的なレスポンスの形"""
    tree: List[TreeUserNodeSchema]
    max_level: int
    min_level: int