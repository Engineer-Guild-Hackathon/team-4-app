from ninja import Schema
from datetime import datetime
from typing import Optional, List
import uuid


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


class TopicUsersResponseSchema(Schema):
    """トピックの参加ユーザー一覧スキーマ"""
    users: List[UserTopicResponseSchema]
    count: int

