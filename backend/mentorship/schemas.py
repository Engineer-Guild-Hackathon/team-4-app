import uuid
from ninja import Schema


class Message(Schema):
    """シンプルなメッセージレスポンス用スキーマ"""

    message: str


class TopicSchema(Schema):
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


class UserSchema(Schema):
    """簡易的なユーザー情報スキーマ"""

    id: int
    username: str


class MentorRequestOut(Schema):
    """弟子入りリクエストの出力スキーマ"""

    id: int
    from_user: UserSchema
    to_user: UserSchema
    topic: TopicSchema
    status: str


class MenteeActionStatus(Schema):
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
    user: UserSchema
    rank: int
    mentor_id: int | None = None
