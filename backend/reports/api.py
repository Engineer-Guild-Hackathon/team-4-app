from posts.models import Post
from threads.models import ThreadMessage
from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from django.contrib.contenttypes.models import ContentType
from .models import Report
from .schemas import ReportIn, ReportOut, UserOut

User = get_user_model()
router = Router()


@router.post("/posts/{post_id}", response={200: ReportOut, 404: dict}, auth=JWTAuth())
def report_post(request, post_id: int, payload: ReportIn):
	post = get_object_or_404(Post, id=post_id)
	content_type = ContentType.objects.get_for_model(Post)
	report = Report.objects.create(
		reporter=request.user,
		reason=payload.reason,
		content_type=content_type,
		object_id=post.id,
	)
	return ReportOut(
        id=report.id,
        reporter=UserOut(id=report.reporter.id, username=report.reporter.username),
        reason=report.reason,
        content_type_id=report.content_type.id,
        object_id=report.object_id,
        created_at=report.created_at.isoformat(),
    )


@router.post("/threadmessages/{message_id}", response={200: ReportOut, 404: dict}, auth=JWTAuth())
def report_threadmessage(request, message_id: int, payload: ReportIn):
	message = get_object_or_404(ThreadMessage, id=message_id)
	content_type = ContentType.objects.get_for_model(ThreadMessage)
	report = Report.objects.create(
		reporter=request.user,
		reason=payload.reason,
		content_type=content_type,
		object_id=message.id,
	)
	return ReportOut(
		id=report.id,
		reporter=UserOut(id=report.reporter.id, username=report.reporter.username),
		reason=report.reason,
		content_type_id=report.content_type.id,
		object_id=report.object_id,
		created_at=report.created_at.isoformat(),
	)