from django.test import TestCase
from django.contrib.auth import get_user_model
from mentorship.models import MentorRelation
from ninja.testing import TestClient
from config.api import api

User = get_user_model()

class MentorshipTests(TestCase):
    def setUp(self):
        self.client = TestClient(api)

        # ユーザーを作成
        self.mentor1 = User.objects.create_user(username='mentor1', email='mentor1@example.com', password='password123')
        self.mentee1_1 = User.objects.create_user(username='mentee1_1', email='mentee1_1@example.com', password='password123')
        self.mentee1_2 = User.objects.create_user(username='mentee1_2', email='mentee1_2@example.com', password='password123')
        self.mentee1_1_1 = User.objects.create_user(username='mentee1_1_1', email='mentee1_1_1@example.com', password='password123')
        self.mentee1_1_2 = User.objects.create_user(username='mentee1_1_2', email='mentee1_1_2@example.com', password='password123')
        self.mentor2 = User.objects.create_user(username='mentor2', email='mentor2@example.com', password='password123')
        self.mentee2_1 = User.objects.create_user(username='mentee2_1', email='mentee2_1@example.com', password='password123')

        # 師弟関係を確立
        MentorRelation.objects.create(mentor=self.mentor1, mentee=self.mentee1_1)
        MentorRelation.objects.create(mentor=self.mentor1, mentee=self.mentee1_2)
        MentorRelation.objects.create(mentor=self.mentee1_1, mentee=self.mentee1_1_1)
        MentorRelation.objects.create(mentor=self.mentee1_1, mentee=self.mentee1_1_2)
        MentorRelation.objects.create(mentor=self.mentor2, mentee=self.mentee2_1)

    def test_get_mentee_subtree_method(self):
        # mentor1のサブツリーをテスト
        subtree = MentorRelation.objects.get_mentee_subtree(self.mentor1.id)
        self.assertEqual(len(subtree), 4)
        mentee_ids = [item['id'] for item in subtree]
        self.assertIn(self.mentee1_1.id, mentee_ids)
        self.assertIn(self.mentee1_2.id, mentee_ids)
        self.assertIn(self.mentee1_1_1.id, mentee_ids)
        self.assertIn(self.mentee1_1_2.id, mentee_ids)

        # レベルを確認
        for item in subtree:
            if item['id'] in [self.mentee1_1.id, self.mentee1_2.id]:
                self.assertEqual(item['level'], 1)
            elif item['id'] in [self.mentee1_1_1.id, self.mentee1_1_2.id]:
                self.assertEqual(item['level'], 2)

        # mentee1_1のサブツリーをテスト
        subtree = MentorRelation.objects.get_mentee_subtree(self.mentee1_1.id)
        self.assertEqual(len(subtree), 2)
        mentee_ids = [item['id'] for item in subtree]
        self.assertIn(self.mentee1_1_1.id, mentee_ids)
        self.assertIn(self.mentee1_1_2.id, mentee_ids)

        for item in subtree:
            if item['id'] in [self.mentee1_1_1.id, self.mentee1_1_2.id]:
                self.assertEqual(item['level'], 1)

        # 弟子がいないユーザーをテスト
        subtree = MentorRelation.objects.get_mentee_subtree(self.mentee1_1_1.id)
        self.assertEqual(len(subtree), 0)

    def test_get_mentee_subtree_api_endpoint(self):
        # API経由でmentor1のサブツリーをテスト
        response = self.client.get(f"/mentorship/mentors/{self.mentor1.id}/subtree")
        self.assertEqual(response.status_code, 200)
        subtree = response.json()
        self.assertEqual(len(subtree), 4)
        mentee_ids = [item['id'] for item in subtree]
        self.assertIn(self.mentee1_1.id, mentee_ids)
        self.assertIn(self.mentee1_2.id, mentee_ids)
        self.assertIn(self.mentee1_1_1.id, mentee_ids)
        self.assertIn(self.mentee1_1_2.id, mentee_ids)

        # APIレスポンスのレベルを確認
        for item in subtree:
            if item['id'] in [self.mentee1_1.id, self.mentee1_2.id]:
                self.assertEqual(item['level'], 1)
            elif item['id'] in [self.mentee1_1_1.id, self.mentee1_1_2.id]:
                self.assertEqual(item['level'], 2)

        # API経由でmentee1_1のサブツリーをテスト
        response = self.client.get(f"/mentorship/mentors/{self.mentee1_1.id}/subtree")
        self.assertEqual(response.status_code, 200)
        subtree = response.json()
        self.assertEqual(len(subtree), 2)
        mentee_ids = [item['id'] for item in subtree]
        self.assertIn(self.mentee1_1_1.id, mentee_ids)
        self.assertIn(self.mentee1_1_2.id, mentee_ids)

        # API経由で弟子がいないユーザーをテスト
        response = self.client.get(f"/mentorship/mentors/{self.mentee1_1_1.id}/subtree")
        self.assertEqual(response.status_code, 200)
        subtree = response.json()
        self.assertEqual(len(subtree), 0)

        # 存在しないmentorをテスト
        response = self.client.get(f"/mentorship/mentors/99999/subtree")
        self.assertEqual(response.status_code, 200) # 404ではなく空リストを返すべき
        self.assertEqual(len(response.json()), 0)
