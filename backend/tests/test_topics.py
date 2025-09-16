from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from topics.models import Topic, UserTopic
from ninja_jwt.tokens import RefreshToken
import uuid
import json

User = get_user_model()

class TopicsTests(TestCase):
    def setUp(self):
        # Djangoの標準テストクライアントを使用
        self.client = Client()
        
        # ユーザーを作成
        self.user1 = User.objects.create_user(username='user1', email='user1@example.com', password='password123')
        self.user2 = User.objects.create_user(username='user2', email='user2@example.com', password='password123')
        self.user3 = User.objects.create_user(username='user3', email='user3@example.com', password='password123')
        
        # トピックを作成
        self.topic = Topic.objects.create(title='テストトピック', description='テスト用のトピックです')
        
        # ユーザーをトピックに参加させる（異なるレベルで）
        UserTopic.objects.create(user=self.user1, topic=self.topic, level=5)
        UserTopic.objects.create(user=self.user2, topic=self.topic, level=3)
        UserTopic.objects.create(user=self.user3, topic=self.topic, level=7)

    def get_auth_headers(self, user):
        """JWT認証ヘッダーを生成する"""
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        return {"Authorization": f"Bearer {access_token}"}

    def test_get_topic_level_info_with_users(self):
        """参加者がいる場合のレベル情報取得テスト"""
        response = self.client.get(f"/api/topics/{self.topic.id}/level-info/")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['max_level'], 7)
        self.assertEqual(data['min_level'], 3)
        self.assertEqual(data['user_count'], 3)

    def test_get_topic_level_info_empty_topic(self):
        """参加者がいない場合のレベル情報取得テスト"""
        # 新しいトピックを作成（参加者なし）
        empty_topic = Topic.objects.create(title='空のトピック', description='参加者がいないトピック')
        
        response = self.client.get(f"/api/topics/{empty_topic.id}/level-info/")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['max_level'], 0)
        self.assertEqual(data['min_level'], 0)
        self.assertEqual(data['user_count'], 0)

    def test_get_topic_level_info_single_user(self):
        """参加者が1人の場合のレベル情報取得テスト"""
        # 新しいトピックを作成
        single_topic = Topic.objects.create(title='単一ユーザートピック', description='参加者が1人のトピック')
        
        # 1人のユーザーのみ参加
        UserTopic.objects.create(user=self.user1, topic=single_topic, level=10)
        
        response = self.client.get(f"/api/topics/{single_topic.id}/level-info/")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['max_level'], 10)
        self.assertEqual(data['min_level'], 10)
        self.assertEqual(data['user_count'], 1)

    def test_get_topic_level_info_nonexistent_topic(self):
        """存在しないトピックのレベル情報取得テスト"""
        fake_uuid = uuid.uuid4()
        response = self.client.get(f"/api/topics/{fake_uuid}/level-info/")
        self.assertEqual(response.status_code, 404)

    def test_join_topic_with_default_level_calculation(self):
        """トピック参加時のデフォルトレベル計算テスト"""
        # 新しいトピックを作成
        new_topic = Topic.objects.create(title='新規トピック', description='デフォルトレベルテスト用')
        
        # 既存のユーザーを参加させる（レベル5, 3, 7）
        UserTopic.objects.create(user=self.user1, topic=new_topic, level=5)
        UserTopic.objects.create(user=self.user2, topic=new_topic, level=3)
        UserTopic.objects.create(user=self.user3, topic=new_topic, level=7)
        
        # レベル情報を取得してデフォルトレベルを計算
        response = self.client.get(f"/api/topics/{new_topic.id}/level-info/")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        # 最低レベルは3なので、デフォルトレベルは2になるはず
        expected_default_level = data['min_level'] - 1
        self.assertEqual(expected_default_level, 2)

    def test_join_topic_empty_topic_default_level(self):
        """空のトピック参加時のデフォルトレベルテスト"""
        # 新しいトピックを作成（参加者なし）
        empty_topic = Topic.objects.create(title='空のトピック', description='参加者がいないトピック')
        
        # レベル情報を取得
        response = self.client.get(f"/api/topics/{empty_topic.id}/level-info/")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        # 参加者がいない場合は1がデフォルトレベル
        expected_default_level = 1 if data['user_count'] == 0 else data['min_level'] - 1
        self.assertEqual(expected_default_level, 1)

    def test_update_mentee_capacity_success(self):
        """弟子定員更新の成功テスト"""
        # 新しいトピックを作成してテスト
        test_topic = Topic.objects.create(title='テストトピック2', description='弟子定員テスト用')
        user_topic = UserTopic.objects.create(user=self.user1, topic=test_topic, level=5)
        
        # 弟子定員を10人に更新
        headers = self.get_auth_headers(self.user1)
        response = self.client.patch(
            f"/api/topics/{test_topic.id}/me/mentee-capacity/",
            data={"mentee_capacity": 10},
            content_type="application/json",
            HTTP_AUTHORIZATION=headers["Authorization"]
        )
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data['level'], 5)
        
        # データベースで確認
        user_topic.refresh_from_db()
        self.assertEqual(user_topic.mentee_capacity, 10)

    def test_update_mentee_capacity_invalid_range(self):
        """弟子定員更新の範囲外テスト"""
        # 新しいトピックを作成してテスト
        test_topic = Topic.objects.create(title='テストトピック3', description='範囲テスト用')
        UserTopic.objects.create(user=self.user1, topic=test_topic, level=5)
        
        headers = self.get_auth_headers(self.user1)
        
        # 0人（範囲外）
        response = self.client.patch(
            f"/api/topics/{test_topic.id}/me/mentee-capacity/",
            data={"mentee_capacity": 0},
            content_type="application/json",
            HTTP_AUTHORIZATION=headers["Authorization"]
        )
        self.assertEqual(response.status_code, 400)
        
        # 101人（範囲外）
        response = self.client.patch(
            f"/api/topics/{test_topic.id}/me/mentee-capacity/",
            data={"mentee_capacity": 101},
            content_type="application/json",
            HTTP_AUTHORIZATION=headers["Authorization"]
        )
        self.assertEqual(response.status_code, 400)

    def test_update_mentee_capacity_below_current_mentees(self):
        """現在の弟子数より少ない定員設定テスト"""
        from mentorship.models import MentorRelation
        
        # 新しいトピックを作成してテスト
        test_topic = Topic.objects.create(title='テストトピック4', description='弟子数テスト用')
        user_topic = UserTopic.objects.create(user=self.user1, topic=test_topic, level=5)
        
        # 師匠関係を作成（弟子を2人追加）
        MentorRelation.objects.create(mentor=self.user1, mentee=self.user2, topic=test_topic)
        MentorRelation.objects.create(mentor=self.user1, mentee=self.user3, topic=test_topic)
        
        headers = self.get_auth_headers(self.user1)
        
        # 定員を1人に設定（現在2人の弟子がいるためエラー）
        response = self.client.patch(
            f"/api/topics/{test_topic.id}/me/mentee-capacity/",
            data={"mentee_capacity": 1},
            content_type="application/json",
            HTTP_AUTHORIZATION=headers["Authorization"]
        )
        self.assertEqual(response.status_code, 400)
        
        data = response.json()
        self.assertIn("現在2人の弟子がいるため", data['detail'])

    def test_update_mentee_capacity_not_participating(self):
        """参加していないトピックの弟子定員更新テスト"""
        # 新しいトピックを作成（参加させない）
        test_topic = Topic.objects.create(title='テストトピック5', description='参加なしテスト用')
        
        headers = self.get_auth_headers(self.user1)
        
        # 弟子定員を更新しようとする
        response = self.client.patch(
            f"/api/topics/{test_topic.id}/me/mentee-capacity/",
            data={"mentee_capacity": 10},
            content_type="application/json",
            HTTP_AUTHORIZATION=headers["Authorization"]
        )
        self.assertEqual(response.status_code, 404)

    def test_update_mentee_capacity_nonexistent_topic(self):
        """存在しないトピックの弟子定員更新テスト"""
        fake_uuid = uuid.uuid4()
        
        headers = self.get_auth_headers(self.user1)
        
        response = self.client.patch(
            f"/api/topics/{fake_uuid}/me/mentee-capacity/",
            data={"mentee_capacity": 10},
            content_type="application/json",
            HTTP_AUTHORIZATION=headers["Authorization"]
        )
        self.assertEqual(response.status_code, 404)
