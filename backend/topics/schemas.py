from ninja import Schema
from datetime import datetime
from typing import Optional


class TopicCreateSchema(Schema):
    title: str
    description: Optional[str] = ""


class TopicUpdateSchema(Schema):
    title: Optional[str] = None
    description: Optional[str] = None


class TopicResponseSchema(Schema):
    id: str  # UUIDなのでstrに修正
    title: str
    description: str
    created_at: datetime
    updated_at: datetime


class TopicListResponseSchema(Schema):
    topics: list[TopicResponseSchema]
    count: int

