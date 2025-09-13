from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
import uuid
from .models import Topic, UserTopic
from .schemas import (
    TopicCreateSchema, TopicUpdateSchema, TopicResponseSchema, TopicListResponseSchema, TreeStructureOut,
    UserTopicCreateSchema, UserTopicUpdateSchema, UserTopicResponseSchema, TopicUsersResponseSchema,
    TreeResponseSchema
)
from mentorship.models import MentorRelation


User = get_user_model()

router = Router()

@router.post("/", response=TopicResponseSchema, auth=JWTAuth())
def create_topic(request, data: TopicCreateSchema):
    """
    トピックを作成する
    """
    topic = Topic.objects.create(
        title=data.title,
        description=data.description or ""
    )
    return topic


@router.get("/", response=TopicListResponseSchema)
def list_topics(request):
    """
    全てのトピックを取得する
    """
    topics = Topic.objects.all()
    return {
        "topics": list(topics),
        # トピックの数を返す
        "count": topics.count()
    }

@router.get("/me/", response=TopicListResponseSchema, auth=JWTAuth())
def get_my_topics(request):
    """
    自分が参加しているトピック一覧を取得する
    """
    user = request.user
    topics = user.topics.all()
    return {
        "topics": list(topics),
        "count": topics.count()
    }


@router.get("/{topic_id}/", response=TopicResponseSchema)
def get_topic(request, topic_id: uuid.UUID):
    """
    特定のトピックを取得する
    """
    topic = get_object_or_404(Topic, id=topic_id)
    return topic


@router.put("/{topic_id}/", response=TopicResponseSchema, auth=JWTAuth())
def update_topic(request, topic_id: uuid.UUID, data: TopicUpdateSchema):
    """
    トピックを更新する
    """
    topic = get_object_or_404(Topic, id=topic_id)
    
    # 提供されたフィールドのみを更新
    if data.title is not None:
        topic.title = data.title
    if data.description is not None:
        topic.description = data.description
    
    topic.save()
    return topic


@router.delete("/{topic_id}/", auth=JWTAuth())
def delete_topic(request, topic_id: uuid.UUID):
    """

    トピックを削除する。1人でも参加ユーザーがいる場合は削除できない。
    """
    topic = get_object_or_404(Topic, id=topic_id)
    if UserTopic.objects.filter(topic=topic).exists():
        return {"detail": "このトピックには関連するユーザーが存在するため削除できません"}, 400
    topic.delete()
    return {"message": "トピックが削除されました"}


# UserTopic関連のエンドポイント
@router.post("/{topic_id}/users/", response=UserTopicResponseSchema, auth=JWTAuth())
def add_user_to_topic(request, topic_id: uuid.UUID, data: UserTopicCreateSchema):
    """
    ユーザーをトピックに参加させる
    """
    topic = get_object_or_404(Topic, id=topic_id)
    user = get_object_or_404(User, id=data.user_id)
    
    # 既に参加しているかチェック
    if UserTopic.objects.filter(user=user, topic=topic).exists():
        return {"detail": "ユーザーは既にこのトピックに参加しています"}, 400
    
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


@router.put("/{topic_id}/users/{user_id}/", response=UserTopicResponseSchema, auth=JWTAuth())
def update_user_topic_level(request, topic_id: uuid.UUID, user_id: int, data: UserTopicUpdateSchema):
    """
    ユーザーのトピック参加レベルを更新する
    """
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


@router.delete("/{topic_id}/users/{user_id}/", auth=JWTAuth())
def remove_user_from_topic(request, topic_id: uuid.UUID, user_id: int):
    """
    ユーザーをトピックから退出させる
    """
    user_topic = get_object_or_404(UserTopic, topic_id=topic_id, user_id=user_id)
    user_topic.delete()
    return {"message": "ユーザーをトピックから退出させました"}


# 阿部TODO: この際に何らかの指定関係を結ぶ場合は、MentorRelationも同時に作成する。引数にmentor_idを追加するのがいいと思う。transaction.atomicデコレータは必須です。
@router.post("/{topic_id}/me/", response=UserTopicResponseSchema, auth=JWTAuth())
def join_topic(request, topic_id: uuid.UUID):
    """
    現在のユーザーをトピックに参加させる
    """
    topic = get_object_or_404(Topic, id=topic_id)
    user = request.user
    
    # 既に参加しているかチェック
    if UserTopic.objects.filter(user=user, topic=topic).exists():
        return {"detail": "既にこのトピックに参加しています"}, 400
    
    user_topic = UserTopic.objects.create(
        user=user,
        topic=topic,
        level=1  # デフォルトレベル
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

@router.get("/{topic_id}/tree/", response=TreeResponseSchema)
def get_topic_tree(request, topic_id: uuid.UUID):
    """
    指定されたトピックの師弟関係をTreeViewer用の形式で返す
    """
    topic = get_object_or_404(Topic, id=topic_id)
    
    # 1. このトピックに参加している全ユーザーとそのレベルを取得
    user_topics = UserTopic.objects.filter(topic=topic).select_related('user')
    
    # 2. このトピックの師弟関係を全て取得
    mentorships = MentorRelation.objects.filter(topic=topic)
    # 弟子のIDをキー、師匠のIDを値とする辞書を作成（高速な検索のため）
    mentee_to_mentor_map = {m.mentee_id: m.mentor_id for m in mentorships}

    # 3. TreeViewerが期待する UserNode のリスト形式に変換
    tree_data = []
    levels = [ut.level for ut in user_topics]
    max_level = max(levels) if levels else 0
    min_level = min(levels) if levels else 0
    for ut in user_topics:
        user_node_data = {
            "user": {
                "id": ut.user.id,
                "username": ut.user.username
            },
            "rank": ut.level,
            "mentor_id": mentee_to_mentor_map.get(ut.user.id) 
        }
        tree_data.append(user_node_data)

    return {"tree": tree_data, "max_level": max_level, "min_level": min_level}

# --------予選時点未使用-----------------------
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