from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction, models
import uuid
from .models import Topic, UserTopic
from mentorship.models import MentorRelation
from .schemas import (
    TopicCreateIn,
    TopicUpdateIn,
    TopicOut,
    TopicListOut,
    MyTopicOut,
    MyTopicListOut,
    UserTopicCreateIn,
    UserTopicUpdateIn,
    UserTopicOut,
    TreeOut,
    JoinTopicIn,
    MenteeCapacityUpdateIn,
)


User = get_user_model()

router = Router()


@router.post("/", response=TopicOut, auth=JWTAuth())
def create_topic(request, data: TopicCreateIn):
    """
    トピックを作成する
    """
    topic = Topic.objects.create(title=data.title, description=data.description or "")
    return topic


@router.get("/", response=TopicListOut)
def list_topics(request):
    """
    全てのトピックを取得する
    """
    topics = Topic.objects.all()
    return {
        "topics": list(topics),
        # トピックの数を返す
        "count": topics.count(),
    }


@router.get("/me/", response=MyTopicListOut, auth=JWTAuth())
def get_my_topics(request):
    """
    自分が参加しているトピック一覧を取得する
    """
    user = request.user
    user_topics = UserTopic.objects.filter(user=user).select_related('topic')
    
    topics_data = []
    for user_topic in user_topics:
        topic = user_topic.topic
        topics_data.append({
            "id": topic.id,
            "title": topic.title,
            "description": topic.description,
            "created_at": topic.created_at,
            "updated_at": topic.updated_at,
            "mentee_capacity": user_topic.mentee_capacity,
        })
    
    return {"topics": topics_data, "count": len(topics_data)}


@router.get("/{topic_id}/", response=TopicOut)
def get_topic(request, topic_id: uuid.UUID):
    """
    特定のトピックを取得する
    """
    topic = get_object_or_404(Topic, id=topic_id)
    return topic


@router.put("/{topic_id}/", response=TopicOut, auth=JWTAuth())
def update_topic(request, topic_id: uuid.UUID, data: TopicUpdateIn):
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
        return {
            "detail": "このトピックには関連するユーザーが存在するため削除できません"
        }, 400
    topic.delete()
    return {"message": "トピックが削除されました"}


# UserTopic関連のエンドポイント
@router.post("/{topic_id}/users/", response=UserTopicOut, auth=JWTAuth())
def add_user_to_topic(request, topic_id: uuid.UUID, data: UserTopicCreateIn):
    """
    ユーザーをトピックに参加させる
    """
    topic = get_object_or_404(Topic, id=topic_id)
    user = get_object_or_404(User, id=data.user_id)

    # 既に参加しているかチェック
    if UserTopic.objects.filter(user=user, topic=topic).exists():
        return {"detail": "ユーザーは既にこのトピックに参加しています"}, 400

    user_topic = UserTopic.objects.create(user=user, topic=topic, level=data.level)

    return UserTopicOut(
        id=user_topic.id,
        user_id=user_topic.user.id,
        username=user_topic.user.username,
        topic_id=user_topic.topic.id,
        topic_title=user_topic.topic.title,
        level=user_topic.level,
        status=user_topic.status,
        created_at=user_topic.created_at,
        updated_at=user_topic.updated_at,
    )


@router.put(
    "/{topic_id}/users/{user_id}/", response=UserTopicOut, auth=JWTAuth()
)
def update_user_topic_level(
    request, topic_id: uuid.UUID, user_id: int, data: UserTopicUpdateIn
):
    """
    ユーザーのトピック参加レベルを更新する
    """
    user_topic = get_object_or_404(UserTopic, topic_id=topic_id, user_id=user_id)
    user_topic.level = data.level
    user_topic.save()

    return UserTopicOut(
        id=user_topic.id,
        user_id=user_topic.user.id,
        username=user_topic.user.username,
        topic_id=user_topic.topic.id,
        topic_title=user_topic.topic.title,
        level=user_topic.level,
        status=user_topic.status,
        created_at=user_topic.created_at,
        updated_at=user_topic.updated_at,
    )


@router.delete("/{topic_id}/users/{user_id}/", auth=JWTAuth())
@transaction.atomic
def remove_user_from_topic(request, topic_id: uuid.UUID, user_id: int):
    """
    ユーザーをトピックから退出させる
    師弟関係も同時に削除する
    """
    user_topic = get_object_or_404(UserTopic, topic_id=topic_id, user_id=user_id)
    user = user_topic.user
    
    # 師弟関係を削除
    MentorRelation.objects.filter(
        models.Q(mentor=user, topic_id=topic_id) | 
        models.Q(mentee=user, topic_id=topic_id)
    ).delete()
    
    # 承認待ちのリクエストも削除（送信したリクエストと受信したリクエストの両方）
    from mentorship.models import MentorRelationRequest
    MentorRelationRequest.objects.filter(
        models.Q(from_user=user, topic_id=topic_id) | 
        models.Q(to_user=user, topic_id=topic_id)
    ).delete()
    
    # UserTopicを削除
    user_topic.delete()
    return {"message": "ユーザーをトピックから退出させました"}


# completed: この際に何らかの指定関係を結ぶ場合は、MentorRelationも同時に作成する。引数にmentor_idを追加するのがいいと思う。transaction.atomicデコレータは必須です。
@router.post("/{topic_id}/me/", response=UserTopicOut, auth=JWTAuth())
def join_topic(request, topic_id: uuid.UUID, data: JoinTopicIn):
    """
    現在のユーザーをトピックに参加させる
    mentor_idが指定された場合は、師弟関係も同時に作成する
    """
    topic = get_object_or_404(Topic, id=topic_id)
    user = request.user

    # 既に参加しているかチェック
    if UserTopic.objects.filter(user=user, topic=topic).exists():
        return {"detail": "既にこのトピックに参加しています"}, 400

    with transaction.atomic():
        # UserTopicを作成
        user_topic = UserTopic.objects.create(
            user=user,
            topic=topic,
            level=data.level,
        )

        # mentor_idが指定された場合は師弟関係を作成
        if data.mentor_id:
            mentor = get_object_or_404(User, id=data.mentor_id)
            
            # 既に師弟関係が存在するかチェック
            if MentorRelation.objects.filter(mentee=user, topic=topic).exists():
                return {"detail": "既にこのトピックで師匠が設定されています"}, 400
            
            # 師弟関係を作成
            MentorRelation.objects.create(
                mentor=mentor,
                mentee=user,
                topic=topic,
            )

    return UserTopicOut(
        id=user_topic.id,
        user_id=user_topic.user.id,
        username=user_topic.user.username,
        topic_id=user_topic.topic.id,
        topic_title=user_topic.topic.title,
        level=user_topic.level,
        status=user_topic.status,
        created_at=user_topic.created_at,
        updated_at=user_topic.updated_at,
    )


@router.get("/{topic_id}/tree/", response=TreeOut)
def get_topic_tree(request, topic_id: uuid.UUID):
    """
    指定されたトピックの師弟関係をTreeViewer用の形式で返す
    """
    topic = get_object_or_404(Topic, id=topic_id)

    user_topics = UserTopic.objects.filter(topic=topic).select_related("user", "user__profile")

    mentorships = MentorRelation.objects.filter(topic=topic)
    mentee_to_mentor_map = {m.mentee_id: m.mentor_id for m in mentorships}

    tree_data = []
    for ut in user_topics:
        avatar_url = None
        if hasattr(ut.user, 'profile') and ut.user.profile.avatar:
            avatar_url = ut.user.profile.avatar.url

        user_node_data = {
            "user": {
                "id": ut.user.id,
                "username": ut.user.username,
                "avatar": avatar_url
            },
            "level": ut.level,
            "mentor_id": mentee_to_mentor_map.get(ut.user.id),
        }
        tree_data.append(user_node_data)
        
    levels = [ut.level for ut in user_topics]
    max_level = max(levels) if levels else 0
    min_level = min(levels) if levels else 0

    return {"tree": tree_data, "max_level": max_level, "min_level": min_level}


@router.get("/{topic_id}/level-info/", response=dict)
def get_topic_level_info(request, topic_id: uuid.UUID):
    """
    指定されたトピックのレベル情報（最高レベル、最低レベル）を取得
    """
    topic = get_object_or_404(Topic, id=topic_id)
    
    user_topics = UserTopic.objects.filter(topic=topic)
    levels = [ut.level for ut in user_topics]
    
    max_level = max(levels) if levels else 0
    min_level = min(levels) if levels else 0
    
    return {
        "max_level": max_level,
        "min_level": min_level,
        "user_count": len(levels)
    }


@router.patch("/{topic_id}/me/mentee-capacity/", response={200: UserTopicOut, 400: dict, 404: dict}, auth=JWTAuth())
def update_mentee_capacity(request, topic_id: uuid.UUID, data: MenteeCapacityUpdateIn):
    """
    現在のユーザーの弟子定員を更新する
    現在の弟子数より少なくはできない
    """
    topic = get_object_or_404(Topic, id=topic_id)
    user = request.user
    
    # ユーザーがトピックに参加しているかチェック
    user_topic = get_object_or_404(UserTopic, user=user, topic=topic)
    
    # 定員の範囲チェック
    if data.mentee_capacity < 1 or data.mentee_capacity > 100:
        return 400, {
            "message": "弟子定員は1人から100人の範囲で設定してください"
        }
    
    # 現在の弟子数を取得
    current_mentee_count = MentorRelation.objects.filter(
        mentor=user, 
        topic=topic
    ).count()
    
    # 新しい定員が現在の弟子数より少ない場合はエラー
    if data.mentee_capacity < current_mentee_count:
        return 400, {
            "message": f"現在{current_mentee_count}人の弟子がいるため、定員を{data.mentee_capacity}人にすることはできません。\n\n先に弟子を破門または卒業させてから定員を変更してください。"
        }
    
    # 弟子定員を更新
    user_topic.mentee_capacity = data.mentee_capacity
    user_topic.save()
    
    return UserTopicOut(
        id=user_topic.id,
        user_id=user_topic.user.id,
        username=user_topic.user.username,
        topic_id=user_topic.topic.id,
        topic_title=user_topic.topic.title,
        level=user_topic.level,
        status=user_topic.status,
        created_at=user_topic.created_at,
        updated_at=user_topic.updated_at,
    )


