from django.test import TestCase
from ninja.testing import TestClient
from .models import Topic
from .views import router
from django.contrib.auth import get_user_model
from users.testutils import get_jwt_auth_headers

User = get_user_model()

class TopicModelTest(TestCase):
    def test_topic_creation(self):
        """トピックの作成テスト"""
        topic = Topic.objects.create(
            title="テストトピック",
            description="テスト説明"
        )
        self.assertEqual(topic.title, "テストトピック")
        self.assertEqual(topic.description, "テスト説明")
        self.assertIsNotNone(topic.id)
        self.assertIsNotNone(topic.created_at)
        self.assertIsNotNone(topic.updated_at)

    def test_topic_str_representation(self):
        """トピックの文字列表現テスト"""
        topic = Topic.objects.create(title="テストタイトル")
        self.assertEqual(str(topic), "テストタイトル")


class TopicAPITest(TestCase):
    def setUp(self):
        Topic.objects.all().delete()
        self.client = TestClient(router)
        self.topic = Topic.objects.create(
            title="テストトピック",
            description="テスト説明"
        )
        # テスト用ユーザーを作成
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.auth_headers = get_jwt_auth_headers(self.user)

    def test_create_topic(self):
        """トピック作成APIテスト"""
        data = {
            "title": "新しいトピック",
            "description": "新しい説明"
        }
        response = self.client.post("/", json=data, headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["title"], "新しいトピック")
        self.assertEqual(response_data["description"], "新しい説明")
        self.assertIn("id", response_data)
        self.assertIn("created_at", response_data)
        self.assertIn("updated_at", response_data)

    def test_list_topics(self):
        """トピック一覧取得APIテスト"""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["count"], 1)
        self.assertEqual(len(response_data["topics"]), 1)
        self.assertEqual(response_data["topics"][0]["title"], "テストトピック")
        self.assertEqual(response_data["topics"][0]["description"], "テスト説明")

    def test_get_topic(self):
        """トピック詳細取得APIテスト"""
        response = self.client.get(f"/{self.topic.id}/")
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["title"], "テストトピック")
        self.assertEqual(response_data["description"], "テスト説明")
        self.assertEqual(response_data["id"], str(self.topic.id))

    def test_update_topic(self):
        """トピック更新APIテスト"""
        data = {"title": "更新されたタイトル"}
        response = self.client.put(f"/{self.topic.id}/", json=data, headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["title"], "更新されたタイトル")
        self.assertEqual(response_data["description"], "テスト説明")  # 更新されていないフィールドは元のまま
        self.assertEqual(response_data["id"], str(self.topic.id))

    def test_delete_topic(self):
        """トピック削除APIテスト"""
        response = self.client.delete(f"/{self.topic.id}/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["message"], "トピックが削除されました")
        self.assertFalse(Topic.objects.filter(id=self.topic.id).exists())

    def test_create_topic_with_empty_description(self):
        """空の説明でトピック作成APIテスト"""
        data = {"title": "タイトルのみのトピック"}
        response = self.client.post("/", json=data, headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["title"], "タイトルのみのトピック")
        self.assertEqual(response_data["description"], "")

    def test_update_topic_partial(self):
        """部分的なトピック更新APIテスト"""
        data = {"description": "説明のみ更新"}
        response = self.client.put(f"/{self.topic.id}/", json=data, headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["title"], "テストトピック")  # 元のまま
        self.assertEqual(response_data["description"], "説明のみ更新")  # 更新された

    def test_get_nonexistent_topic(self):
        """存在しないトピック取得APIテスト"""
        import uuid
        nonexistent_id = str(uuid.uuid4())
        response = self.client.get(f"/{nonexistent_id}/")
        self.assertEqual(response.status_code, 404)

    def test_update_nonexistent_topic(self):
        """存在しないトピック更新APIテスト"""
        import uuid
        nonexistent_id = str(uuid.uuid4())
        data = {"title": "存在しないトピック"}
        response = self.client.put(f"/{nonexistent_id}/", json=data, headers=self.auth_headers)
        self.assertEqual(response.status_code, 404)

    def test_delete_nonexistent_topic(self):
        """存在しないトピック削除APIテスト"""
        import uuid
        nonexistent_id = str(uuid.uuid4())
        response = self.client.delete(f"/{nonexistent_id}/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 404)

    def test_get_my_topics(self):
        """自分が参加しているトピック一覧取得APIテスト"""
        # ユーザーとトピックを作成
        topic1 = Topic.objects.create(title="参加トピック1")
        topic2 = Topic.objects.create(title="参加トピック2")
        # UserTopicで紐付け
        from topics.models import UserTopic
        UserTopic.objects.create(user=self.user, topic=topic1, level=1)
        UserTopic.objects.create(user=self.user, topic=topic2, level=2)
        
        response = self.client.get("/me/", headers=self.auth_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["count"], 2)
        titles = [t["title"] for t in data["topics"]]
        self.assertIn("参加トピック1", titles)
        self.assertIn("参加トピック2", titles)
