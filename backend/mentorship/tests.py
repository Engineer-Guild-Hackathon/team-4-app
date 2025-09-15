from django.test import TestCase
from django.contrib.auth import get_user_model
from mentorship.models import MentorRelationRequest, MentorRelation, ActionLog
from topics.models import Topic, UserTopic
from users.testutils import get_jwt_auth_headers

User = get_user_model()


class MentorAPITestCase(TestCase):
    def setUp(self):
        """Set up test users and a topic for all tests."""
        self.user1 = User.objects.create_user(username="user1", password="pass123")
        self.user2 = User.objects.create_user(username="user2", password="pass123")
        self.user3 = User.objects.create_user(username="user3", password="pass123")
        self.user4 = User.objects.create_user(username="user4", password="pass123")
        self.superuser = User.objects.create_superuser(
            username="superuser", password="pass123"
        )
        self.topic = Topic.objects.create(
            title="Test Topic", description="Description for test topic"
        )
        self.client.login(username="user1", password="pass123")

    def test_create_mentor_request_success(self):
        """
        Test: 弟子入りリクエスト作成（成功）
        """
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user2.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            MentorRelationRequest.objects.filter(
                from_user=self.user1, to_user=self.user2
            ).exists()
        )

    def test_create_mentor_request_to_self_fails(self):
        """
        Test: 自分自身への弟子入りリクエスト（失敗）
        """
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user1.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"message": "You cannot send a mentor request to yourself."},
        )

    def test_create_mentor_request_pending_exists_fails(self):
        """
        Test: 既存の保留中リクエストがある場合の重複リクエスト（失敗）
        """
        MentorRelationRequest.objects.create(
            from_user=self.user1, to_user=self.user2, topic=self.topic
        )
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user2.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"message": "A pending request to this user already exists."},
        )

    def test_approve_mentor_request_success(self):
        """
        Test: 弟子入りリクエストの承認（成功）
        """
        mr = MentorRelationRequest.objects.create(
            from_user=self.user1, to_user=self.user2, topic=self.topic
        )
        self.client.login(username="user2", password="pass123")  # 受信者としてログイン
        response = self.client.post(f"/api/mentorship/requests/{mr.id}/approve")

        self.assertEqual(response.status_code, 200)
        mr.refresh_from_db()
        self.assertEqual(mr.status, "approved")
        self.assertTrue(
            MentorRelation.objects.filter(
                mentor=self.user2, mentee=self.user1, topic=self.topic
            ).exists()
        )

    def test_approve_mentor_request_unauthorized_fails(self):
        """
        Test: 権限のないユーザーによる承認（失敗）
        """
        mr = MentorRelationRequest.objects.create(
            from_user=self.user1, to_user=self.user2, topic=self.topic
        )
        # user1がログインしていますが、受信者ではありません
        response = self.client.post(f"/api/mentorship/requests/{mr.id}/approve")
        self.assertEqual(response.status_code, 403)

    def test_reject_mentor_request_success(self):
        """
        Test: 弟子入りリクエストの拒否（成功）
        """
        mr = MentorRelationRequest.objects.create(
            from_user=self.user1, to_user=self.user2, topic=self.topic
        )
        self.client.login(username="user2", password="pass123")  # 受信者としてログイン
        response = self.client.post(f"/api/mentorship/requests/{mr.id}/reject")

        self.assertEqual(response.status_code, 200)
        mr.refresh_from_db()
        self.assertEqual(mr.status, "rejected")

    def test_reject_mentor_request_unauthorized_fails(self):
        """
        Test: 権限のないユーザーによる拒否（失敗）
        """
        mr = MentorRelationRequest.objects.create(
            from_user=self.user1, to_user=self.user2, topic=self.topic
        )
        # user1がログインしていますが、受信者ではありません
        response = self.client.post(f"/api/mentorship/requests/{mr.id}/reject")
        self.assertEqual(response.status_code, 403)

    def test_create_multiple_requests_to_different_mentors_succeeds(self):
        """
        Test: 異なるメンターへ複数のリクエストを作成（成功）
        """
        topic2 = Topic.objects.create(title="Test Topic 2")

        # Request 1: user1 -> user2 with self.topic
        response1 = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user2.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
        )
        # Request 2: user1 -> user3 with topic2
        response2 = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user3.id, "topic_id": str(topic2.id)},
            content_type="application/json",
        )
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)

        self.assertEqual(
            MentorRelationRequest.objects.filter(from_user=self.user1).count(), 2
        )

    def test_create_request_when_relation_exists_fails(self):
        """
        Test: 既存の師弟関係があるユーザーへのリクエスト（失敗）
        """
        MentorRelation.objects.create(
            mentor=self.user2, mentee=self.user1, topic=self.topic
        )
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user2.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.json(),
            {"message": "You are already in a mentorship with this user."},
        )

    def test_graduate_mentee_success(self):
        """
        Test: 弟子を卒業させる（成功）
        """
        # Setup: user2 (mentor) -> user1 (mentee) -> user3 (grandchild)
        MentorRelation.objects.create(
            mentor=self.user2, mentee=self.user1, topic=self.topic
        )
        MentorRelation.objects.create(
            mentor=self.user1, mentee=self.user3, topic=self.topic
        )

        # Setup topic levels
        mentor_level = 10
        mentee_level = 5
        grandchild_level = 2
        UserTopic.objects.create(user=self.user2, topic=self.topic, level=mentor_level)
        UserTopic.objects.create(user=self.user1, topic=self.topic, level=mentee_level)
        UserTopic.objects.create(
            user=self.user3, topic=self.topic, level=grandchild_level
        )

        # Action: user2 graduates user1
        self.client.login(username="user2", password="pass123")
        response = self.client.post(
            f"/api/mentorship/mentees/{self.user1.id}/graduate",
            {"topic_id": str(self.topic.id)},
            content_type="application/json",
        )

        # Assertions
        self.assertEqual(response.status_code, 200)

        # Assert levels were updated correctly
        self.assertEqual(
            UserTopic.objects.get(user=self.user1, topic=self.topic).level, mentor_level
        )
        level_delta = mentor_level - mentee_level
        self.assertEqual(
            UserTopic.objects.get(user=self.user3, topic=self.topic).level,
            grandchild_level + level_delta,
        )

        # Assert relation was removed and log was created
        self.assertFalse(
            MentorRelation.objects.filter(
                mentor=self.user2, mentee=self.user1, topic=self.topic
            ).exists()
        )
        self.assertTrue(
            ActionLog.objects.filter(
                actor=self.user2, target=self.user1, action="graduate"
            ).exists()
        )

    def test_graduate_mentee_unauthorized_fails(self):
        """
        Test: 権限のないユーザーによる卒業（失敗）
        """
        # 師弟関係を作成
        MentorRelation.objects.create(
            mentor=self.user2, mentee=self.user1, topic=self.topic
        )

        # 別のユーザー（師匠ではない）としてログイン
        self.client.login(username="user3", password="pass123")
        response = self.client.post(
            f"/api/mentorship/mentees/{self.user1.id}/graduate",
            {"topic_id": str(self.topic.id)},
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)

    def test_expel_mentee_success(self):
        """
        Test: 弟子を破門する（成功）
        """
        MentorRelation.objects.create(
            mentor=self.user2, mentee=self.user1, topic=self.topic
        )

        self.client.login(username="user2", password="pass123")

        response = self.client.post(
            f"/api/mentorship/mentees/{self.user1.id}/expel",
            {"topic_id": str(self.topic.id)},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(), {"status": "expel", "mentee_id": self.user1.id}
        )
        self.assertFalse(
            MentorRelation.objects.filter(
                mentor=self.user2, mentee=self.user1, topic=self.topic
            ).exists()
        )
        self.assertTrue(
            ActionLog.objects.filter(
                actor=self.user2, target=self.user1, action="expel"
            ).exists()
        )

    def test_expel_mentee_unauthorized_fails(self):
        """
        Test: 権限のないユーザーによる破門（失敗）
        """
        MentorRelation.objects.create(
            mentor=self.user2, mentee=self.user1, topic=self.topic
        )

        self.client.login(username="user3", password="pass123")

        response = self.client.post(
            f"/api/mentorship/mentees/{self.user1.id}/expel",
            {"topic_id": str(self.topic.id)},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)

    def test_mentor_selection_required_unauthorized_fails(self):
        """
        Test: 認証されていないユーザーによる師匠選択判定（失敗）
        """
        # ログアウトして認証なしでアクセス
        self.client.logout()
        
        response = self.client.get(
            f"/api/mentorship/mentor-selection/required/{self.topic.id}"
        )
        
        self.assertEqual(response.status_code, 401)

    def test_mentor_selection_required_success(self):
        """
        Test: 師匠選択判定（成功）
        """
        # UserTopicを作成
        UserTopic.objects.create(user=self.user1, topic=self.topic, level=1)
        
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.get(
            f"/api/mentorship/mentor-selection/required/{self.topic.id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("required", response.json())

    def test_mentor_selection_required_with_mentor_false(self):
        """
        Test: 師匠がいる場合の師匠選択判定（false）
        """
        # UserTopicを作成
        UserTopic.objects.create(user=self.user1, topic=self.topic, level=1)
        UserTopic.objects.create(user=self.user2, topic=self.topic, level=2)
        
        # 師弟関係を作成
        MentorRelation.objects.create(
            mentor=self.user2, mentee=self.user1, topic=self.topic
        )
        
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.get(
            f"/api/mentorship/mentor-selection/required/{self.topic.id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["required"])

    def test_mentor_selection_required_max_level_false(self):
        """
        Test: 最高レベルの場合の師匠選択判定（false）
        """
        # UserTopicを作成（最高レベル）
        UserTopic.objects.create(user=self.user1, topic=self.topic, level=3)
        UserTopic.objects.create(user=self.user2, topic=self.topic, level=1)
        
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.get(
            f"/api/mentorship/mentor-selection/required/{self.topic.id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["required"])

    def test_mentor_selection_required_pending_request_false(self):
        """
        Test: 保留中のリクエストがある場合の師匠選択判定（false）
        """
        # UserTopicを作成
        UserTopic.objects.create(user=self.user1, topic=self.topic, level=1)
        UserTopic.objects.create(user=self.user2, topic=self.topic, level=2)
        
        # 保留中の師匠選択リクエストを作成
        MentorRelationRequest.objects.create(
            from_user=self.user1, to_user=self.user2, topic=self.topic, status="pending"
        )
        
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.get(
            f"/api/mentorship/mentor-selection/required/{self.topic.id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data["required"])

    def test_mentor_selection_required_user_topic_not_found(self):
        """
        Test: UserTopicが存在しない場合の師匠選択判定（エラー）
        """
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.get(
            f"/api/mentorship/mentor-selection/required/{self.topic.id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)
