from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from topics.models import Topic, UserTopic
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
