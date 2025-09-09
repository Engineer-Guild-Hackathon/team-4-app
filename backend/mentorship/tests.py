import logging
from django.test import TestCase
from django.contrib.auth import get_user_model
from mentorship.models import MentorRelationRequest, MentorRelation

User = get_user_model()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class MentorAPITestCase(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username="user1", password="pass123")
        self.user2 = User.objects.create_user(username="user2", password="pass123")
        self.client.login(username="user1", password="pass123")

    def log_test_result(self, test_name, response, passed=True):
        status = "テスト成功 ✅" if passed else "テスト失敗 ❌"
        logger.info(f"\n{test_name} — {status}")
        logger.info(f"認証ユーザー: {self.client.session.get('_auth_user_id')}")
        logger.info(f"レスポンスステータス: {response.status_code}, 内容: {response.content.decode()}\n")

    def test_create_mentor_request_success(self):
        test_name = "弟子入りリクエスト作成（リクエスト承認）"
        try:
            response = self.client.post(
                "/api/mentorship/request",
                {"to_user_id": self.user2.id},
                content_type="application/json"
            )
            self.assertEqual(response.status_code, 200)
            self.assertTrue(MentorRelationRequest.objects.filter(from_user=self.user1, to_user=self.user2).exists())
            self.log_test_result(test_name, response, passed=True)
        except AssertionError:
            self.log_test_result(test_name, response, passed=False)
            raise

    def test_create_mentor_request_to_self_fails(self):
        test_name = "自分自身への弟子入りリクエスト（リクエスト拒否）"
        try:
            response = self.client.post(
                "/api/mentorship/request",
                {"to_user_id": self.user1.id},
                content_type="application/json"
            )
            self.assertEqual(response.status_code, 400)
            self.log_test_result(test_name, response, passed=True)
        except AssertionError:
            self.log_test_result(test_name, response, passed=False)
            raise

    def test_create_mentor_request_pending_exists_fails(self):
        test_name = "既存保留中リクエストがある場合の重複テスト"
        try:
            MentorRelationRequest.objects.create(from_user=self.user1, to_user=self.user2)
            response = self.client.post(
                "/api/mentorship/request",
                {"to_user_id": self.user2.id},
                content_type="application/json"
            )
            self.assertEqual(response.status_code, 400)
            self.log_test_result(test_name, response, passed=True)
        except AssertionError:
            self.log_test_result(test_name, response, passed=False)
            raise

    def test_approve_mentor_request_success(self):
        test_name = "弟子入りリクエスト承認（認証リクエスト承認）"
        try:
            mr = MentorRelationRequest.objects.create(from_user=self.user1, to_user=self.user2)
            self.client.logout()
            self.client.login(username="user2", password="pass123")
            response = self.client.post(f"/api/mentorship/requests/{mr.id}/approve")
            self.assertEqual(response.status_code, 200)
            mr.refresh_from_db()
            self.assertEqual(mr.status, "approved")
            self.assertTrue(MentorRelation.objects.filter(mentor=self.user2, mentee=self.user1).exists())
            self.log_test_result(test_name, response, passed=True)
        except AssertionError:
            self.log_test_result(test_name, response, passed=False)
            raise

    def test_approve_mentor_request_unauthorized_fails(self):
        test_name = "権限のないユーザーによる承認（認証失敗）"
        try:
            mr = MentorRelationRequest.objects.create(from_user=self.user1, to_user=self.user2)
            response = self.client.post(f"/api/mentorship/requests/{mr.id}/approve")
            self.assertEqual(response.status_code, 403)
            self.log_test_result(test_name, response, passed=True)
        except AssertionError:
            self.log_test_result(test_name, response, passed=False)
            raise

    def test_reject_mentor_request_success(self):
        test_name = "弟子入りリクエスト拒否（リクエスト承認）"
        try:
            mr = MentorRelationRequest.objects.create(from_user=self.user1, to_user=self.user2)
            self.client.logout()
            self.client.login(username="user2", password="pass123")
            response = self.client.post(f"/api/mentorship/requests/{mr.id}/reject")
            self.assertEqual(response.status_code, 200)
            mr.refresh_from_db()
            self.assertEqual(mr.status, "rejected")
            self.log_test_result(test_name, response, passed=True)
        except AssertionError:
            self.log_test_result(test_name, response, passed=False)
            raise

    def test_reject_mentor_request_unauthorized_fails(self):
        test_name = "権限のないユーザーによる拒否（リクエスト拒否）"
        try:
            mr = MentorRelationRequest.objects.create(from_user=self.user1, to_user=self.user2)
            response = self.client.post(f"/api/mentorship/requests/{mr.id}/reject")
            self.assertEqual(response.status_code, 403)
            self.log_test_result(test_name, response, passed=True)
        except AssertionError:
            self.log_test_result(test_name, response, passed=False)
            raise
