from ninja import Router
from django.shortcuts import get_object_or_404
import uuid
from .models import Topic
from .schemas import TopicCreateSchema, TopicUpdateSchema, TopicResponseSchema, TopicListResponseSchema

router = Router()

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