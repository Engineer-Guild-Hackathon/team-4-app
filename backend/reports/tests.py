
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from posts.models import Post
from threads.models import Thread, ThreadMessage
from reports.models import Report
from ninja_jwt.tokens import RefreshToken

from topics.models import Topic

User = get_user_model()

class ReportApiTestCase(TestCase):
	def setUp(self):
		self.user = User.objects.create_user(username="user1", password="pass123")
		self.other = User.objects.create_user(username="user2", password="pass123")
		self.topic = Topic.objects.create(title="Test Topic")
		self.post = Post.objects.create(author=self.user, content="test post", topic=self.topic)
		self.thread = Thread.objects.create(topic=self.topic, starter=self.user, mentor=self.other)
		self.message = ThreadMessage.objects.create(thread=self.thread, author=self.user, content="test msg")
		refresh = RefreshToken.for_user(self.user)
		self.access_token = str(refresh.access_token)

	def test_report_post_success(self):
		payload = {"reason": "spam"}
		response = self.client.post(
			f"/api/reports/posts/{self.post.id}",
			data=json.dumps(payload),
			content_type="application/json",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		data = response.json()
		self.assertEqual(data["object_id"], self.post.id)
		self.assertEqual(data["reason"], "spam")
		self.assertEqual(data["reporter"]["id"], self.user.id)

	def test_report_threadmessage_success(self):
		payload = {"reason": "abuse"}
		response = self.client.post(
			f"/api/reports/threadmessages/{self.message.id}",
			data=json.dumps(payload),
			content_type="application/json",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		data = response.json()
		self.assertEqual(data["object_id"], self.message.id)
		self.assertEqual(data["reason"], "abuse")
		self.assertEqual(data["reporter"]["id"], self.user.id)

	def test_report_post_not_found(self):
		payload = {"reason": "spam"}
		response = self.client.post(
			f"/api/reports/posts/99999",
			data=json.dumps(payload),
			content_type="application/json",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 404)

	def test_report_threadmessage_not_found(self):
		payload = {"reason": "abuse"}
		response = self.client.post(
			f"/api/reports/threadmessages/99999",
			data=json.dumps(payload),
			content_type="application/json",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 404)
