from datetime import datetime
import uuid
from ninja import Schema
from pydantic import Field

from posts.schemas import PostOut
from topics.schemas import TopicOut

class UserOut(Schema):
    id: int
    username: str
    email: str
    avatar: str | None = None

class ThreadOut(Schema):
	id: int
	topic: TopicOut
	starter: UserOut
	mentor: UserOut
	related_post_id: int | None = None
	created_at: datetime
	messages: list['ThreadMessageOut'] = []
	title: str


class ThreadMessageOut(Schema):
	id: int
	author: UserOut
	content: str
	parent_id: int | None = None
	created_at: datetime

class ThreadMessageCreateIn(Schema):
	content: str = Field(..., max_length=200)
	parent_id: int | None = None

class ThreadCreateIn(Schema):
	topic_id: uuid.UUID
	mentor_id: int
	title: str