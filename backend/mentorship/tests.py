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
        self.user5 = User.objects.create_user(username="user5", password="pass123")
        self.superuser = User.objects.create_superuser(
            username="superuser", password="pass123"
        )
        self.topic = Topic.objects.create(
            title="Test Topic", description="Description for test topic"
        )
        
        # UserTopicを作成（定員テスト用）
        self.user1_topic = UserTopic.objects.create(
            user=self.user1, topic=self.topic, level=5, mentee_capacity=3
        )
        self.user2_topic = UserTopic.objects.create(
            user=self.user2, topic=self.topic, level=4, mentee_capacity=3
        )
        self.user3_topic = UserTopic.objects.create(
            user=self.user3, topic=self.topic, level=3, mentee_capacity=3
        )
        self.user4_topic = UserTopic.objects.create(
            user=self.user4, topic=self.topic, level=2, mentee_capacity=3
        )
        self.user5_topic = UserTopic.objects.create(
            user=self.user5, topic=self.topic, level=1, mentee_capacity=3
        )

    def test_create_mentor_request_success(self):
        """
        Test: 弟子入りリクエスト作成（成功）
        """
        headers = get_jwt_auth_headers(self.user2)
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user1.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(
            MentorRelationRequest.objects.filter(
                from_user=self.user2, to_user=self.user1
            ).exists()
        )

    def test_create_mentor_request_to_self_fails(self):
        """
        Test: 自分自身への弟子入りリクエスト（失敗）
        """
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user1.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
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
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user2.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
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
        headers = get_jwt_auth_headers(self.user2)  # 受信者として認証
        response = self.client.post(
            f"/api/mentorship/requests/{mr.id}/approve",
            headers=headers
        )

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
        # user1が認証されていますが、受信者ではありません
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.post(
            f"/api/mentorship/requests/{mr.id}/approve",
            headers=headers
        )
        self.assertEqual(response.status_code, 403)

    def test_reject_mentor_request_success(self):
        """
        Test: 弟子入りリクエストの拒否（成功）
        """
        mr = MentorRelationRequest.objects.create(
            from_user=self.user1, to_user=self.user2, topic=self.topic
        )
        headers = get_jwt_auth_headers(self.user2)  # 受信者として認証
        response = self.client.post(
            f"/api/mentorship/requests/{mr.id}/reject",
            headers=headers
        )

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
        # user1が認証されていますが、受信者ではありません
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.post(
            f"/api/mentorship/requests/{mr.id}/reject",
            headers=headers
        )
        self.assertEqual(response.status_code, 403)

    def test_create_multiple_requests_to_different_mentors_succeeds(self):
        """
        Test: 異なるメンターへ複数のリクエストを作成（成功）
        """
        topic2 = Topic.objects.create(title="Test Topic 2")
        # topic2用のUserTopicを作成
        UserTopic.objects.create(user=self.user1, topic=topic2, level=5, mentee_capacity=3)
        UserTopic.objects.create(user=self.user2, topic=topic2, level=4, mentee_capacity=3)
        UserTopic.objects.create(user=self.user3, topic=topic2, level=3, mentee_capacity=3)
        
        headers = get_jwt_auth_headers(self.user2)

        # Request 1: user2 -> user1 with self.topic
        response1 = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user1.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
        )
        # Request 2: user3 -> user2 with topic2
        headers2 = get_jwt_auth_headers(self.user3)
        response2 = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user2.id, "topic_id": str(topic2.id)},
            content_type="application/json",
            headers=headers2,
        )
        self.assertEqual(response1.status_code, 200)
        self.assertEqual(response2.status_code, 200)

        self.assertEqual(
            MentorRelationRequest.objects.filter(from_user__in=[self.user2, self.user3]).count(), 2
        )

    def test_create_request_when_relation_exists_fails(self):
        """
        Test: 既存の師弟関係があるユーザーへのリクエスト（失敗）
        """
        MentorRelation.objects.create(
            mentor=self.user2, mentee=self.user1, topic=self.topic
        )
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.user2.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
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
        # 既存のUserTopicを更新
        self.user2_topic.level = mentor_level
        self.user2_topic.save()
        self.user1_topic.level = mentee_level
        self.user1_topic.save()
        self.user3_topic.level = grandchild_level
        self.user3_topic.save()

        # Action: user2 graduates user1
        headers = get_jwt_auth_headers(self.user2)
        response = self.client.post(
            f"/api/mentorship/mentees/{self.user1.id}/graduate",
            {"topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
        )

        # Assertions
        self.assertEqual(response.status_code, 200)

        # Assert levels were updated correctly
        self.assertEqual(
            UserTopic.objects.get(user=self.user1, topic=self.topic).level, mentor_level + 1
        )
        level_delta = (mentor_level + 1) - mentee_level
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

        # 別のユーザー（師匠ではない）として認証
        headers = get_jwt_auth_headers(self.user3)
        response = self.client.post(
            f"/api/mentorship/mentees/{self.user1.id}/graduate",
            {"topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
        )
        self.assertEqual(response.status_code, 404)

    def test_expel_mentee_success(self):
        """
        Test: 弟子を破門する（成功）
        """
        MentorRelation.objects.create(
            mentor=self.user2, mentee=self.user1, topic=self.topic
        )

        headers = get_jwt_auth_headers(self.user2)

        response = self.client.post(
            f"/api/mentorship/mentees/{self.user1.id}/expel",
            {"topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
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

        headers = get_jwt_auth_headers(self.user3)

        response = self.client.post(
            f"/api/mentorship/mentees/{self.user1.id}/expel",
            {"topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
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
        # 既存のUserTopicのレベルを更新
        self.user1_topic.level = 1
        self.user1_topic.save()
        
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
        # 既存のUserTopicのレベルを更新
        self.user1_topic.level = 1
        self.user1_topic.save()
        self.user2_topic.level = 2
        self.user2_topic.save()
        
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
        # 既存のUserTopicのレベルを更新（最高レベル）
        self.user1_topic.level = 3
        self.user1_topic.save()
        self.user2_topic.level = 1
        self.user2_topic.save()
        
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
        # 既存のUserTopicのレベルを更新
        self.user1_topic.level = 1
        self.user1_topic.save()
        self.user2_topic.level = 2
        self.user2_topic.save()
        
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
        # 新しいトピックを作成（UserTopicが存在しない）
        new_topic = Topic.objects.create(title="New Topic", description="No UserTopic")
        
        headers = get_jwt_auth_headers(self.user1)
        response = self.client.get(
            f"/api/mentorship/mentor-selection/required/{new_topic.id}",
            headers=headers
        )
        
        self.assertEqual(response.status_code, 404)


class MentorCapacityTestCase(TestCase):
    """定員制システムのテストケース"""
    
    def setUp(self):
        """Set up test users and a topic for capacity tests."""
        self.mentor = User.objects.create_user(username="mentor", password="pass123")
        self.mentee1 = User.objects.create_user(username="mentee1", password="pass123")
        self.mentee2 = User.objects.create_user(username="mentee2", password="pass123")
        self.mentee3 = User.objects.create_user(username="mentee3", password="pass123")
        self.mentee4 = User.objects.create_user(username="mentee4", password="pass123")
        
        self.topic = Topic.objects.create(
            title="Capacity Test Topic", description="Description for capacity test"
        )
        
        # 師匠のUserTopic（定員3）
        self.mentor_topic = UserTopic.objects.create(
            user=self.mentor, topic=self.topic, level=5, mentee_capacity=3
        )
        
        # 弟子たちのUserTopic
        self.mentee1_topic = UserTopic.objects.create(
            user=self.mentee1, topic=self.topic, level=4, mentee_capacity=3
        )
        self.mentee2_topic = UserTopic.objects.create(
            user=self.mentee2, topic=self.topic, level=3, mentee_capacity=3
        )
        self.mentee3_topic = UserTopic.objects.create(
            user=self.mentee3, topic=self.topic, level=2, mentee_capacity=3
        )
        self.mentee4_topic = UserTopic.objects.create(
            user=self.mentee4, topic=self.topic, level=1, mentee_capacity=3
        )

    def test_capacity_within_limit_direct_mentorship(self):
        """定員内の場合：直接師弟関係が作成される"""
        headers = get_jwt_auth_headers(self.mentee1)
        
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.mentor.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
        )
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "approved")
        
        # 師弟関係が直接作成されているかチェック
        self.assertTrue(
            MentorRelation.objects.filter(
                mentor=self.mentor, mentee=self.mentee1, topic=self.topic
            ).exists()
        )
        
        # 承認済みリクエストが作成されている
        self.assertTrue(
            MentorRelationRequest.objects.filter(
                from_user=self.mentee1, to_user=self.mentor, topic=self.topic, status="approved"
            ).exists()
        )

    def test_capacity_exceeded_requires_approval(self):
        """定員超過の場合：承認制でリクエストが作成される"""
        # 定員いっぱいまで師弟関係を作成
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee1, topic=self.topic)
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee2, topic=self.topic)
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee3, topic=self.topic)
        
        headers = get_jwt_auth_headers(self.mentee4)
        
        response = self.client.post(
            "/api/mentorship/request",
            {"to_user_id": self.mentor.id, "topic_id": str(self.topic.id)},
            content_type="application/json",
            headers=headers,
        )
        
        self.assertEqual(response.status_code, 200)
        # リクエストオブジェクトが返される
        data = response.json()
        self.assertIn("id", data)
        self.assertEqual(data["status"], "pending")
        
        # 師弟関係は作成されていない
        self.assertFalse(
            MentorRelation.objects.filter(
                mentor=self.mentor, mentee=self.mentee4, topic=self.topic
            ).exists()
        )
        
        # リクエストが作成されている
        self.assertTrue(
            MentorRelationRequest.objects.filter(
                from_user=self.mentee4, to_user=self.mentor, topic=self.topic, status="pending"
            ).exists()
        )

    def test_approve_with_mentee_selection_expel(self):
        """定員超過時の承認：弟子を破門して新しい弟子を受け入れる"""
        # 定員いっぱいまで師弟関係を作成
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee1, topic=self.topic)
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee2, topic=self.topic)
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee3, topic=self.topic)
        
        # 新しい弟子からのリクエストを作成
        request = MentorRelationRequest.objects.create(
            from_user=self.mentee4, to_user=self.mentor, topic=self.topic, status="pending"
        )
        
        headers = get_jwt_auth_headers(self.mentor)
        
        # 弟子選択付きで承認（mentee1を破門）
        response = self.client.post(
            f"/api/mentorship/requests/{request.id}/approve-with-selection",
            {"mentee_id": self.mentee1.id, "action": "expel"},
            content_type="application/json",
            headers=headers,
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 新しい師弟関係が作成されている
        self.assertTrue(
            MentorRelation.objects.filter(
                mentor=self.mentor, mentee=self.mentee4, topic=self.topic
            ).exists()
        )
        
        # 破門された弟子との関係は削除されている
        self.assertFalse(
            MentorRelation.objects.filter(
                mentor=self.mentor, mentee=self.mentee1, topic=self.topic
            ).exists()
        )
        
        # 破門された弟子のステータスがEXPELLEDになっている
        self.mentee1_topic.refresh_from_db()
        self.assertEqual(self.mentee1_topic.status, UserTopic.Status.EXPELLED)

    def test_approve_with_mentee_selection_graduate(self):
        """定員超過時の承認：弟子を卒業して新しい弟子を受け入れる"""
        # 定員いっぱいまで師弟関係を作成
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee1, topic=self.topic)
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee2, topic=self.topic)
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee3, topic=self.topic)
        
        # 新しい弟子からのリクエストを作成
        request = MentorRelationRequest.objects.create(
            from_user=self.mentee4, to_user=self.mentor, topic=self.topic, status="pending"
        )
        
        headers = get_jwt_auth_headers(self.mentor)
        
        # 弟子選択付きで承認（mentee1を卒業）
        response = self.client.post(
            f"/api/mentorship/requests/{request.id}/approve-with-selection",
            {"mentee_id": self.mentee1.id, "action": "graduate"},
            content_type="application/json",
            headers=headers,
        )
        
        self.assertEqual(response.status_code, 200)
        
        # 新しい師弟関係が作成されている
        self.assertTrue(
            MentorRelation.objects.filter(
                mentor=self.mentor, mentee=self.mentee4, topic=self.topic
            ).exists()
        )
        
        # 卒業された弟子との関係は削除されている
        self.assertFalse(
            MentorRelation.objects.filter(
                mentor=self.mentor, mentee=self.mentee1, topic=self.topic
            ).exists()
        )
        
        # 卒業された弟子のステータスがGRADUATEDになっている
        self.mentee1_topic.refresh_from_db()
        self.assertEqual(self.mentee1_topic.status, UserTopic.Status.GRADUATED)
        
        # 卒業された弟子のレベルが上がっている
        self.assertEqual(self.mentee1_topic.level, 6)  # 師匠のレベル+1

    def test_get_mentor_capacity(self):
        """師匠の定員情報取得テスト"""
        # 2人の弟子を作成
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee1, topic=self.topic)
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee2, topic=self.topic)
        
        headers = get_jwt_auth_headers(self.mentor)
        
        response = self.client.get(f"/api/mentorship/capacity/{self.topic.id}", headers=headers)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["current_count"], 2)
        self.assertEqual(data["capacity"], 3)
        self.assertTrue(data["is_within_capacity"])
        self.assertEqual(data["remaining_slots"], 1)

    def test_get_mentees_list(self):
        """師匠の弟子一覧取得テスト"""
        # 弟子関係を作成
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee1, topic=self.topic)
        MentorRelation.objects.create(mentor=self.mentor, mentee=self.mentee2, topic=self.topic)
        
        headers = get_jwt_auth_headers(self.mentor)
        
        response = self.client.get(f"/api/mentorship/mentees/{self.topic.id}", headers=headers)
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        
        # 弟子の情報が正しく返されているかチェック
        mentee_ids = [mentee["id"] for mentee in data]
        self.assertIn(self.mentee1.id, mentee_ids)
        self.assertIn(self.mentee2.id, mentee_ids)
