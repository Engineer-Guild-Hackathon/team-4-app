from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.contrib.auth import get_user_model
from .models import Thread, ThreadMessage
from .schemas import ThreadOut, ThreadCreateIn, ThreadMessageOut, ThreadMessageCreateIn
from topics.models import Topic
from mentorship.models import MentorRelation
from django.db.models import Q
import uuid


User = get_user_model()
router = Router()

@router.get("", response=list[ThreadOut], auth=JWTAuth())
def list_threads(request, mentor_id: int = None, topic_id: str = None):
	filters = {}
	if mentor_id:
		filters["mentor_id"] = mentor_id
	if topic_id:
		filters["topic_id"] = topic_id
	threads = Thread.objects.filter(**filters).select_related("topic", "starter", "mentor").prefetch_related("messages__author")
	return threads

@router.post("", response={200: ThreadOut, 400: dict, 403: dict}, auth=JWTAuth())
@transaction.atomic
def create_thread(request, payload: ThreadCreateIn):
	topic = get_object_or_404(Topic, id=payload.topic_id)
	mentor = get_object_or_404(User, id=payload.mentor_id)
	mentorship = MentorRelation.objects.filter(mentor=mentor, mentee=request.user, topic=topic).first()
	if not mentorship:
		return 403, {"message": "選択されたトピックでこの師匠とスレッドを作成する権限がありません"}
	thread = Thread.objects.create(
		topic=topic,
		starter=request.user,
		mentor=mentor,
	)
	return thread

@router.delete("/{thread_id}", response={200: dict, 404: dict}, auth=JWTAuth())
@transaction.atomic
def delete_thread(request, thread_id: int):
	thread = get_object_or_404(Thread, id=thread_id)
	if thread.starter != request.user:
		return 404, {"message": "このスレッドを削除する権限がありません"}
	thread.delete()
	return {"message": "スレッドを削除しました"}

@router.post("/{thread_id}/messages", response={200: ThreadMessageOut, 400: dict, 403: dict}, auth=JWTAuth())
@transaction.atomic
def send_message(request, thread_id: int, payload: ThreadMessageCreateIn):
	thread = get_object_or_404(Thread, id=thread_id)
	mentorship = MentorRelation.objects.filter(
		topic=thread.topic,
	).filter(
		(Q(mentor=thread.mentor, mentee=request.user) | Q(mentor=request.user, mentee=thread.starter))
    ).first()
	if not mentorship:
		return 403, {"message": "このスレッドにメッセージを送信する権限がありません"}
	parent = None
	if payload.parent_id:
		parent = get_object_or_404(ThreadMessage, id=payload.parent_id)
	message = ThreadMessage.objects.create(
		thread=thread,
		author=request.user,
		content=payload.content,
		parent=parent,
	)
	return message

@router.delete("/{thread_id}/messages/{message_id}", response={200: dict, 404: dict, 403: dict}, auth=JWTAuth())
@transaction.atomic
def delete_message(request, thread_id: int, message_id: int):
	thread = get_object_or_404(Thread, id=thread_id)
	message = get_object_or_404(ThreadMessage, id=message_id, thread=thread)
	if message.author != request.user:
		return 403, {"message": "このメッセージを削除する権限がありません"}
	message.delete()
	return {"message": "メッセージを削除しました"}

@router.get("/check-permission/", response=dict, auth=JWTAuth())
def check_thread_permission(request, mentor_id: int, topic_id: uuid.UUID):
    topic = get_object_or_404(Topic, id=topic_id)
    mentor = get_object_or_404(User, id=mentor_id)

    can_create = MentorRelation.objects.filter(
        mentor=mentor,
        mentee=request.auth, 
        topic=topic
    ).exists()
    
    return {"can_create": can_create}