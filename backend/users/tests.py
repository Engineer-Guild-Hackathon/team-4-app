
from django.test import TestCase
from ninja.testing import TestClient
from django.contrib.auth import get_user_model
from config.urls import api
from .views import router

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
		self.assertEqual(response_data["username"], "newuser")
		self.assertEqual(response_data["email"], "new@example.com")
		self.assertIn("id", response_data)

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
		self.assertEqual(response_data["email"], "api@example.com")

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
		self.assertEqual(response_data["email"], "updated@example.com")

	def test_delete_user(self):
		user = User.objects.create_user(username="deluser", email="del@example.com", password="pass")
		response = self.client.delete(f"/{user.id}/", headers=self.headers)
		self.assertEqual(response.status_code, 204)
		response_data = response.json()
		self.assertTrue(response_data["success"])
		self.assertFalse(User.objects.filter(id=user.id).exists())
