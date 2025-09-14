
import json
from django.contrib.auth import get_user_model
from django.test import TestCase
from topics.models import Topic
from posts.models import Post
from threads.models import Thread, ThreadMessage
from ninja_jwt.tokens import RefreshToken

User = get_user_model()

class ThreadApiTestCase(TestCase):
	def test_delete_message_success(self):
		thread = Thread.objects.create(topic=self.topic, starter=self.user, mentor=self.mentor)
		msg = ThreadMessage.objects.create(thread=thread, author=self.user, content="delete me")
		response = self.client.delete(
			f"/api/threads/{thread.id}/messages/{msg.id}",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		self.assertFalse(ThreadMessage.objects.filter(id=msg.id).exists())

	def test_delete_message_fail_not_author(self):
		thread = Thread.objects.create(topic=self.topic, starter=self.user, mentor=self.mentor)
		other_user = User.objects.create_user(username="other", password="pass123")
		msg = ThreadMessage.objects.create(thread=thread, author=other_user, content="not mine")
		response = self.client.delete(
			f"/api/threads/{thread.id}/messages/{msg.id}",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 403)
		self.assertTrue(ThreadMessage.objects.filter(id=msg.id).exists())
		
	def setUp(self):
		self.user = User.objects.create_user(username="user1", password="pass123")
		self.mentor = User.objects.create_user(username="mentor1", password="pass123")
		self.topic = Topic.objects.create(title="Test Topic")
		self.post = Post.objects.create(author=self.user, content="Test Post", topic=self.topic)
		# JWT取得
		refresh = RefreshToken.for_user(self.user)
		self.access_token = str(refresh.access_token)
		
	def test_list_threads_filtering(self):
		# 他のユーザー・トピック・メンターも作成
		user2 = User.objects.create_user(username="user2", password="pass123")
		mentor2 = User.objects.create_user(username="mentor2", password="pass123")
		topic2 = Topic.objects.create(title="Other Topic")

		# 3つのスレッドを作成
		t1 = Thread.objects.create(topic=self.topic, starter=self.user, mentor=self.mentor)
		t2 = Thread.objects.create(topic=topic2, starter=user2, mentor=self.mentor)
		t3 = Thread.objects.create(topic=self.topic, starter=self.user, mentor=mentor2)

		# 何も指定しない場合（全件）
		response = self.client.get(
			"/api/threads",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		self.assertEqual(len(response.json()), 3)

		# mentor_idで絞り込み
		response = self.client.get(
			f"/api/threads?mentor_id={self.mentor.id}",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		ids = [t["id"] for t in response.json()]
		self.assertIn(t1.id, ids)
		self.assertIn(t2.id, ids)
		self.assertNotIn(t3.id, ids)

		# topic_idで絞り込み
		response = self.client.get(
			f"/api/threads?topic_id={self.topic.id}",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		ids = [t["id"] for t in response.json()]
		self.assertIn(t1.id, ids)
		self.assertIn(t3.id, ids)
		self.assertNotIn(t2.id, ids)

		# 両方指定（AND条件）
		response = self.client.get(
			f"/api/threads?mentor_id={self.mentor.id}&topic_id={self.topic.id}",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		ids = [t["id"] for t in response.json()]
		self.assertEqual(ids, [t1.id])

	def test_create_thread_success(self):
		payload = {
			"topic_id": str(self.topic.id),
			"mentor_id": self.mentor.id,
			"message": {
				"content": "Hello, this is the first message in the thread.",
            }
		}
		response = self.client.post(
			"/api/threads",
			data=json.dumps(payload),
			content_type="application/json",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		self.assertTrue(Thread.objects.filter(starter=self.user, mentor=self.mentor, topic=self.topic).exists())

	def test_create_thread_fail_invalid_topic(self):
		payload = {
			"topic_id": "00000000-0000-0000-0000-000000000000",
			"mentor_id": self.mentor.id,
			"message": {
                "content": "Hello, this is the first message in the thread.",
            }
		}
		response = self.client.post(
			"/api/threads",
			data=json.dumps(payload),
			content_type="application/json",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 404)

	def test_send_message_success(self):
		thread = Thread.objects.create(topic=self.topic, starter=self.user, mentor=self.mentor)
		payload = {"content": "Hello!", "parent_id": None}
		response = self.client.post(
			f"/api/threads/{thread.id}/messages",
			data=json.dumps(payload),
			content_type="application/json",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		self.assertTrue(ThreadMessage.objects.filter(thread=thread, author=self.user, content="Hello!").exists())

	def test_send_message_fail_invalid_thread(self):
		payload = {"content": "Hello!", "parent_id": None}
		response = self.client.post(
			f"/api/threads/999/messages",
			data=json.dumps(payload),
			content_type="application/json",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 404)

	def test_delete_thread_success(self):
		thread = Thread.objects.create(topic=self.topic, starter=self.user, mentor=self.mentor)
		response = self.client.delete(
			f"/api/threads/{thread.id}",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 200)
		self.assertFalse(Thread.objects.filter(id=thread.id).exists())

	def test_delete_thread_fail_not_owner(self):
		other_user = User.objects.create_user(username="user2", password="pass123")
		thread = Thread.objects.create(topic=self.topic, starter=other_user, mentor=self.mentor)
		response = self.client.delete(
			f"/api/threads/{thread.id}",
			HTTP_AUTHORIZATION=f"Bearer {self.access_token}"
		)
		self.assertEqual(response.status_code, 404)
