from django.test import TestCase
from ninja.testing import TestClient
from .models import Topic, UserTopic
from .api import router
from django.contrib.auth import get_user_model
from mentorship.models import MentorRelation, MentorRelationRequest
from users.testutils import get_jwt_auth_headers

User = get_user_model()


class TopicModelTest(TestCase):
    def test_topic_creation(self):
        """トピックの作成テスト"""
        topic = Topic.objects.create(title="テストトピック", description="テスト説明")
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
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.auth_headers = get_jwt_auth_headers(self.user)
        self.topic = Topic.objects.create(
            title="テストトピック", description="テスト説明"
        )

    def test_get_topic_users_tree_structure(self):
        """
        get_topic_usersエンドポイントでTreeStructureOutが正しく返るかテスト
        """
        mentor = User.objects.create_user(username="mentor", password="pass")
        mentee = User.objects.create_user(username="mentee", password="pass")
        grandchild = User.objects.create_user(username="grandchild", password="pass")
        topic = Topic.objects.create(title="Tree構造テスト", description="test")
        # UserTopic
        UserTopic.objects.create(user=mentor, topic=topic, level=10)
        UserTopic.objects.create(user=mentee, topic=topic, level=5)
        UserTopic.objects.create(user=grandchild, topic=topic, level=2)
        # 師弟関係 mentor→mentee→grandchild
        MentorRelation.objects.create(mentor=mentor, mentee=mentee, topic=topic)
        MentorRelation.objects.create(mentor=mentee, mentee=grandchild, topic=topic)

        client = TestClient(router)
        auth_headers = get_jwt_auth_headers(mentor)
        # GETメソッドが許可されていないので405を期待
        response = client.get(f"/{topic.id}/users/", headers=auth_headers)
        assert response.status_code == 405

    def test_create_topic(self):
        """トピック作成APIテスト"""
        data = {"title": "新しいトピック", "description": "新しい説明"}
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
        response = self.client.put(
            f"/{self.topic.id}/", json=data, headers=self.auth_headers
        )
        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertEqual(response_data["title"], "更新されたタイトル")
        self.assertEqual(
            response_data["description"], "テスト説明"
        )  # 更新されていないフィールドは元のまま
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
        response = self.client.put(
            f"/{self.topic.id}/", json=data, headers=self.auth_headers
        )
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
        response = self.client.put(
            f"/{nonexistent_id}/", json=data, headers=self.auth_headers
        )
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


class TopicExitTestCase(TestCase):
    """トピック退出時の師弟関係削除テスト"""
    
    def setUp(self):
        """Set up test users and a topic for exit tests."""
        self.mentor = User.objects.create_user(username="mentor", password="pass123")
        self.mentee1 = User.objects.create_user(username="mentee1", password="pass123")
        self.mentee2 = User.objects.create_user(username="mentee2", password="pass123")
        self.mentee3 = User.objects.create_user(username="mentee3", password="pass123")
        
        self.topic = Topic.objects.create(
            title="Exit Test Topic", description="Description for exit test"
        )
        
        # UserTopicを作成
        self.mentor_topic = UserTopic.objects.create(
            user=self.mentor, topic=self.topic, level=5, mentee_capacity=3
        )
        self.mentee1_topic = UserTopic.objects.create(
            user=self.mentee1, topic=self.topic, level=4, mentee_capacity=3
        )
        self.mentee2_topic = UserTopic.objects.create(
            user=self.mentee2, topic=self.topic, level=3, mentee_capacity=3
        )
        self.mentee3_topic = UserTopic.objects.create(
            user=self.mentee3, topic=self.topic, level=2, mentee_capacity=3
        )
        
        # 師弟関係を作成
        # mentor -> mentee1 -> mentee2
        # mentor -> mentee3
        self.mentor_mentee1_relation = MentorRelation.objects.create(
            mentor=self.mentor, mentee=self.mentee1, topic=self.topic
        )
        self.mentee1_mentee2_relation = MentorRelation.objects.create(
            mentor=self.mentee1, mentee=self.mentee2, topic=self.topic
        )
        self.mentor_mentee3_relation = MentorRelation.objects.create(
            mentor=self.mentor, mentee=self.mentee3, topic=self.topic
        )
        
        # 承認待ちのリクエストも作成（テスト用）
        self.pending_request = MentorRelationRequest.objects.create(
            from_user=self.mentee2, to_user=self.mentor, topic=self.topic, status="pending"
        )

    def test_remove_mentor_from_topic_deletes_all_relations(self):
        """師匠をトピックから退出させた場合、全ての師弟関係が削除される"""
        self.client = TestClient(router)
        headers = get_jwt_auth_headers(self.mentor)
        
        # 師匠をトピックから退出
        response = self.client.delete(
            f"/{self.topic.id}/users/{self.mentor.id}/", 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 師匠のUserTopicが削除されている
        self.assertFalse(
            UserTopic.objects.filter(user=self.mentor, topic=self.topic).exists()
        )
        
        # 師匠に関連する全ての師弟関係が削除されている
        self.assertFalse(
            MentorRelation.objects.filter(mentor=self.mentor, topic=self.topic).exists()
        )
        self.assertFalse(
            MentorRelation.objects.filter(mentee=self.mentor, topic=self.topic).exists()
        )
        
        # 師匠に関連する承認待ちのリクエストも削除されている
        self.assertFalse(
            MentorRelationRequest.objects.filter(to_user=self.mentor, topic=self.topic).exists()
        )
        
        # 他の師弟関係は残っている
        self.assertTrue(
            MentorRelation.objects.filter(mentor=self.mentee1, mentee=self.mentee2, topic=self.topic).exists()
        )

    def test_remove_mentee_from_topic_deletes_relations(self):
        """弟子をトピックから退出させた場合、関連する師弟関係が削除される"""
        self.client = TestClient(router)
        headers = get_jwt_auth_headers(self.mentee1)
        
        # mentee1をトピックから退出
        response = self.client.delete(
            f"/{self.topic.id}/users/{self.mentee1.id}/", 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        
        # mentee1のUserTopicが削除されている
        self.assertFalse(
            UserTopic.objects.filter(user=self.mentee1, topic=self.topic).exists()
        )
        
        # mentee1に関連する師弟関係が削除されている
        self.assertFalse(
            MentorRelation.objects.filter(mentor=self.mentee1, topic=self.topic).exists()
        )
        self.assertFalse(
            MentorRelation.objects.filter(mentee=self.mentee1, topic=self.topic).exists()
        )
        
        # mentee1が送信した承認待ちのリクエストも削除されている
        self.assertFalse(
            MentorRelationRequest.objects.filter(from_user=self.mentee1, topic=self.topic).exists()
        )
        
        # 他の師弟関係は残っている
        self.assertTrue(
            MentorRelation.objects.filter(mentor=self.mentor, mentee=self.mentee3, topic=self.topic).exists()
        )

    def test_remove_middle_mentee_deletes_cascade_relations(self):
        """中間の弟子を退出させた場合、その弟子の子孫関係も削除される"""
        self.client = TestClient(router)
        headers = get_jwt_auth_headers(self.mentee1)
        
        # mentee1をトピックから退出（mentee1はmentee2の師匠でもある）
        response = self.client.delete(
            f"/{self.topic.id}/users/{self.mentee1.id}/", 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        
        # mentee1のUserTopicが削除されている
        self.assertFalse(
            UserTopic.objects.filter(user=self.mentee1, topic=self.topic).exists()
        )
        
        # mentee1に関連する師弟関係が削除されている
        self.assertFalse(
            MentorRelation.objects.filter(mentor=self.mentee1, topic=self.topic).exists()
        )
        self.assertFalse(
            MentorRelation.objects.filter(mentee=self.mentee1, topic=self.topic).exists()
        )
        
        # mentee2は残っているが、師匠がいなくなった状態
        self.assertTrue(
            UserTopic.objects.filter(user=self.mentee2, topic=self.topic).exists()
        )
        self.assertFalse(
            MentorRelation.objects.filter(mentee=self.mentee2, topic=self.topic).exists()
        )

    def test_remove_user_with_no_relations(self):
        """師弟関係がないユーザーを退出させた場合、正常に削除される"""
        # 師弟関係のないユーザーを作成
        isolated_user = User.objects.create_user(username="isolated", password="pass123")
        isolated_user_topic = UserTopic.objects.create(
            user=isolated_user, topic=self.topic, level=1, mentee_capacity=3
        )
        
        self.client = TestClient(router)
        headers = get_jwt_auth_headers(isolated_user)
        
        # 孤立したユーザーをトピックから退出
        response = self.client.delete(
            f"/{self.topic.id}/users/{isolated_user.id}/", 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        
        # UserTopicが削除されている
        self.assertFalse(
            UserTopic.objects.filter(user=isolated_user, topic=self.topic).exists()
        )
        
        # 他の師弟関係は影響を受けていない
        self.assertTrue(
            MentorRelation.objects.filter(mentor=self.mentor, mentee=self.mentee1, topic=self.topic).exists()
        )
        self.assertTrue(
            MentorRelation.objects.filter(mentor=self.mentor, mentee=self.mentee3, topic=self.topic).exists()
        )

    def test_remove_nonexistent_user_from_topic(self):
        """存在しないユーザーをトピックから退出させようとした場合、404エラー"""
        self.client = TestClient(router)
        headers = get_jwt_auth_headers(self.mentor)
        
        # 存在しないユーザーIDで退出を試行
        response = self.client.delete(
            f"/{self.topic.id}/users/99999/", 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)

    def test_remove_user_deletes_pending_requests(self):
        """ユーザーをトピックから退出させた場合、承認待ちのリクエストも削除される"""
        self.client = TestClient(router)
        headers = get_jwt_auth_headers(self.mentee2)
        
        # mentee2をトピックから退出（mentee2は承認待ちのリクエストを送信している）
        response = self.client.delete(
            f"/{self.topic.id}/users/{self.mentee2.id}/", 
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        
        # mentee2のUserTopicが削除されている
        self.assertFalse(
            UserTopic.objects.filter(user=self.mentee2, topic=self.topic).exists()
        )
        
        # mentee2が送信した承認待ちのリクエストが削除されている
        self.assertFalse(
            MentorRelationRequest.objects.filter(from_user=self.mentee2, topic=self.topic).exists()
        )
        
        # 他の師弟関係は影響を受けていない
        self.assertTrue(
            MentorRelation.objects.filter(mentor=self.mentor, mentee=self.mentee1, topic=self.topic).exists()
        )
        self.assertTrue(
            MentorRelation.objects.filter(mentor=self.mentor, mentee=self.mentee3, topic=self.topic).exists()
        )
