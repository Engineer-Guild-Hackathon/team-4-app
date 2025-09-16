
from django.test import TestCase
from ninja.testing import TestClient
from django.contrib.auth import get_user_model
from config.urls import api
from .api import router
from .models import Block

User = get_user_model()

class UserModelTest(TestCase):
	def test_user_creation(self):
		user = User.objects.create_user(
			username="testuser",
			email="test@example.com",
			password="testpass123"
		)
		self.assertEqual(user.username, "testuser")
		self.assertEqual(user.email, "test@example.com")
		self.assertTrue(user.check_password("testpass123"))
		self.assertIsNotNone(user.id)

	def test_user_str_representation(self):
		user = User.objects.create_user(username="struser", password="pass")
		self.assertEqual(str(user), "struser")

class UserAPITest(TestCase):
	def setUp(self):
		self.client = TestClient(router)
		self.user = User.objects.create_user(
			username="apiuser",
			email="api@example.com",
			password="apipass"
		)
		from users.testutils import get_jwt_auth_headers
		self.headers = get_jwt_auth_headers(self.user)

	def test_create_user(self):
		data = {
			"username": "newuser",
			"email": "new@example.com",
			"password": "newpass"
		}
		response = self.client.post("/", json=data, headers=self.headers)
		self.assertEqual(response.status_code, 201)
		response_data = response.json()
		self.assertEqual(response_data["user"]["username"], "newuser")
		self.assertIn("id", response_data["user"])

	def test_list_users(self):
		User.objects.create_user(username="u1", email="u1@example.com", password="pass")
		User.objects.create_user(username="u2", email="u2@example.com", password="pass")
		response = self.client.get("/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertTrue(any(u["username"] == "u1" for u in response_data))
		self.assertTrue(any(u["username"] == "u2" for u in response_data))

	def test_get_user(self):
		response = self.client.get(f"/{self.user.id}/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertEqual(response_data["username"], "apiuser")

	def test_update_user(self):
		data = {
			"username": "updateduser",
			"email": "updated@example.com",
			"password": "updatedpass"
		}
		response = self.client.put(f"/{self.user.id}/", json=data, headers=self.headers)
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertEqual(response_data["username"], "updateduser")

	def test_delete_user(self):
		user = User.objects.create_user(username="deluser", email="del@example.com", password="pass")
		response = self.client.delete(f"/{user.id}/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertTrue(response_data["success"])
		self.assertFalse(User.objects.filter(id=user.id).exists())

	def test_block_user_success(self):
		user_to_block = User.objects.create_user(username="blockme", email="blockme@example.com", password="pass")
		response = self.client.post(f"/{user_to_block.id}/block/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		self.assertTrue(Block.objects.filter(blocker=self.user, blocked=user_to_block).exists())
		self.assertIn("blocked", response.json()["message"])

	def test_block_user_self(self):
		response = self.client.post(f"/{self.user.id}/block/", headers=self.headers)
		self.assertEqual(response.status_code, 400)
		self.assertIn("cannot block yourself", response.json()["message"])

	def test_unblock_user_success(self):
		user_to_block = User.objects.create_user(username="blockme2", email="blockme2@example.com", password="pass")
		Block.objects.create(blocker=self.user, blocked=user_to_block)
		response = self.client.post(f"/{user_to_block.id}/unblock/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		self.assertFalse(Block.objects.filter(blocker=self.user, blocked=user_to_block).exists())
		self.assertIn("unblocked", response.json()["message"])

	def test_user_detail_blocked_and_blocking(self):
		# 他ユーザー作成
		other = User.objects.create_user(username="otheruser", email="other@example.com", password="pass")
		# 自分がotherをブロック
		Block.objects.create(blocker=self.user, blocked=other)
		# otherが自分をブロック
		Block.objects.create(blocker=other, blocked=self.user)

		# blocking=True, blocked=True
		response = self.client.get(f"/{other.id}/", headers=self.headers)
		self.assertEqual(response.status_code, 403)
		self.assertIn("blocked", response.json()["message"])

		# blockingのみTrue
		Block.objects.filter(blocker=other, blocked=self.user).delete()
		response = self.client.get(f"/{other.id}/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		data = response.json()
		self.assertTrue(data["blocking"])
		self.assertFalse(data["blocked"])

		# blockedのみTrue
		Block.objects.filter(blocker=self.user, blocked=other).delete()
		Block.objects.create(blocker=other, blocked=self.user)
		response = self.client.get(f"/{other.id}/", headers=self.headers)
		self.assertEqual(response.status_code, 403)
		self.assertIn("blocked", response.json()["message"])

		# 両方False
		Block.objects.filter(blocker=other, blocked=self.user).delete()
		response = self.client.get(f"/{other.id}/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		data = response.json()
		self.assertFalse(data["blocking"])
		self.assertFalse(data["blocked"])