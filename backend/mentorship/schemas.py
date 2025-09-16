import uuid
from ninja import Schema

class TopicOut(Schema):
    """トピック情報スキーマ"""

    id: uuid.UUID
    title: str


class TopicId(Schema):
    """トピックidスキーマ"""

    topic_id: uuid.UUID


class MentorRequestIn(Schema):
    """弟子入りリクエストの入力スキーマ"""

    to_user_id: int
    topic_id: str


class UserEasyOut(Schema):
    """簡易的なユーザー情報スキーマ"""

    id: int
    username: str


class MentorRequestOut(Schema):
    """弟子入りリクエストの出力スキーマ"""

    id: int
    from_user: UserEasyOut
    to_user: UserEasyOut
    topic: TopicOut
    status: str


class MenteeActionStatusOut(Schema):
    """弟子に対するアクションのステータスレスポンススキーマ"""

    status: str
    mentee_id: int


class PromoteUserIn(Schema):
    """ユーザー昇格/降格の入力スキーマ"""

    user_id: int
    rank_difference: int


class MenteeSubtreeOut(Schema):
    """メンターの弟子ツリー情報スキーマ"""

    id: int
    username: str
    email: str
    level: int


class UserNodeOut(Schema):
    user: UserEasyOut
    rank: int
    mentor_id: int | None = None


class MenteeSelectionIn(Schema):
    """承認時の弟子選択スキーマ"""
    
    mentee_id: int
    action: str  # "expel" または "graduate"


class MenteeInfoOut(Schema):
    """弟子情報スキーマ"""
    
    id: int
    username: str
    first_name: str
    last_name: str
    level: int
    created_at: str
