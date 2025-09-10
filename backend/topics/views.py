from ninja import Router
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
import uuid
from .models import Topic, UserTopic
from .schemas import (
    TopicCreateSchema, TopicUpdateSchema, TopicResponseSchema, TopicListResponseSchema, TreeStructureOut,
    UserTopicCreateSchema, UserTopicUpdateSchema, UserTopicResponseSchema, TopicUsersResponseSchema
)
from mentorship.models import MentorRelation


User = get_user_model()

router = Router(tags=["topics"])

@router.post("/", response=TopicResponseSchema)
def create_topic(request, data: TopicCreateSchema):
    """トピックを作成する"""
    topic = Topic.objects.create(
        title=data.title,
        description=data.description or ""
    )
    return topic


@router.get("/", response=TopicListResponseSchema)
def list_topics(request):
    """トピック一覧を取得する"""
    topics = Topic.objects.all()
    return {
        "topics": list(topics),
        # トピックの数を返す
        "count": topics.count()
    }


@router.get("/{topic_id}/", response=TopicResponseSchema)
def get_topic(request, topic_id: uuid.UUID):
    """特定のトピックを取得する"""
    topic = get_object_or_404(Topic, id=topic_id)
    return topic


@router.put("/{topic_id}/", response=TopicResponseSchema)
def update_topic(request, topic_id: uuid.UUID, data: TopicUpdateSchema):
    """トピックを更新する"""
    topic = get_object_or_404(Topic, id=topic_id)
    
    # 提供されたフィールドのみを更新
    if data.title is not None:
        topic.title = data.title
    if data.description is not None:
        topic.description = data.description
    
    topic.save()
    return topic


@router.delete("/{topic_id}/")
def delete_topic(request, topic_id: uuid.UUID):
    """トピックを削除する"""
    topic = get_object_or_404(Topic, id=topic_id)
    topic.delete()
    return {"message": "トピックが削除されました"}


# UserTopic関連のエンドポイント
@router.post("/{topic_id}/users/", response=UserTopicResponseSchema)
def add_user_to_topic(request, topic_id: uuid.UUID, data: UserTopicCreateSchema):
    """ユーザーをトピックに参加させる"""
    topic = get_object_or_404(Topic, id=topic_id)
    user = get_object_or_404(User, id=data.user_id)
    
    # 既に参加しているかチェック
    if UserTopic.objects.filter(user=user, topic=topic).exists():
        return {"error": "ユーザーは既にこのトピックに参加しています"}, 400
    
    user_topic = UserTopic.objects.create(
        user=user,
        topic=topic,
        level=data.level
    )
    
    return UserTopicResponseSchema(
        id=user_topic.id,
        user_id=user_topic.user.id,
        username=user_topic.user.username,
        topic_id=user_topic.topic.id,
        topic_title=user_topic.topic.title,
        level=user_topic.level,
        created_at=user_topic.created_at,
        updated_at=user_topic.updated_at
    )


@router.get("/{topic_id}/users/", response=TreeStructureOut)
def get_topic_users(request, topic_id: uuid.UUID):
    """トピックの参加ユーザー一覧を取得する"""
    topic = get_object_or_404(Topic, id=topic_id)
    parent_map = {rel.mentee_id: rel.mentor_id for rel in MentorRelation.objects.filter(topic_id=topic_id)}
    user_topics = UserTopic.objects.filter(topic=topic).select_related('user')
    users = []
    levels = []
    for ut in user_topics:
        user_out = {
            "id": ut.user.id,
            "username": ut.user.username,
            "is_active": ut.user.is_active,
            "is_staff": ut.user.is_staff
        }
        parent_id = parent_map.get(ut.user.id)
        users.append({
            "user": user_out,
            "level": ut.level,
            "parent_id": parent_id
        })
        levels.append(ut.level)
    max_level = max(levels) if levels else 0
    min_level = min(levels) if levels else 0
    return {
        "users": users,
        "max_level": max_level,
        "min_level": min_level
    }


@router.put("/{topic_id}/users/{user_id}/", response=UserTopicResponseSchema)
def update_user_topic_level(request, topic_id: uuid.UUID, user_id: int, data: UserTopicUpdateSchema):
    """ユーザーのトピック参加レベルを更新する"""
    user_topic = get_object_or_404(UserTopic, topic_id=topic_id, user_id=user_id)
    user_topic.level = data.level
    user_topic.save()
    
    return UserTopicResponseSchema(
        id=user_topic.id,
        user_id=user_topic.user.id,
        username=user_topic.user.username,
        topic_id=user_topic.topic.id,
        topic_title=user_topic.topic.title,
        level=user_topic.level,
        created_at=user_topic.created_at,
        updated_at=user_topic.updated_at
    )


@router.delete("/{topic_id}/users/{user_id}/")
def remove_user_from_topic(request, topic_id: uuid.UUID, user_id: int):
    """ユーザーをトピックから退出させる"""
    user_topic = get_object_or_404(UserTopic, topic_id=topic_id, user_id=user_id)
    user_topic.delete()
    return {"message": "ユーザーをトピックから退出させました"}