
from django.test import TestCase
from ninja.testing import TestClient
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from unittest.mock import patch
from config.urls import api
from .api import router
from .models import Block, UserProfile

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


class UserProfileModelTest(TestCase):
	def test_user_profile_creation(self):
		"""ユーザープロフィール作成テスト"""
		user = User.objects.create_user(username="testuser1", email="test1@example.com", password="testpass")
		# シグナルで自動作成されたプロフィールを取得して更新
		profile = user.profile
		profile.bio = "これはテスト用の自己紹介です。"
		profile.save()
		self.assertEqual(profile.user, user)
		self.assertEqual(profile.bio, "これはテスト用の自己紹介です。")

	def test_user_profile_bio_max_length(self):
		"""自己紹介の最大文字数テスト"""
		user = User.objects.create_user(username="testuser2", email="test2@example.com", password="testpass")
		max_bio = "あ" * 500
		# シグナルで自動作成されたプロフィールを取得して更新
		profile = user.profile
		profile.bio = max_bio
		profile.save()
		self.assertEqual(len(profile.bio), 500)
		self.assertEqual(profile.bio, max_bio)

	def test_user_profile_empty_bio(self):
		"""空の自己紹介テスト"""
		user = User.objects.create_user(username="testuser3", email="test3@example.com", password="testpass")
		# シグナルで自動作成されたプロフィールを取得して更新
		profile = user.profile
		profile.bio = ""
		profile.save()
		self.assertEqual(profile.bio, "")

	def test_user_profile_str_representation(self):
		"""ユーザープロフィールの文字列表現テスト"""
		user = User.objects.create_user(username="testuser4", email="test4@example.com", password="testpass")
		# シグナルで自動作成されたプロフィールを取得して更新
		profile = user.profile
		profile.bio = "テスト自己紹介"
		profile.save()
		self.assertEqual(str(profile), "testuser4")

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

	def test_delete_my_account(self):
		# 削除前のユーザーIDを保存
		user_id = self.user.id
		response = self.client.delete("/me/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertIn("アカウントが正常に削除されました", response_data["message"])
		self.assertFalse(User.objects.filter(id=user_id).exists())

	def test_block_user_success(self):
		user_to_block = User.objects.create_user(username="blockme", email="blockme@example.com", password="pass")
		response = self.client.post(f"/{user_to_block.id}/block/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		self.assertTrue(Block.objects.filter(blocker=self.user, blocked=user_to_block).exists())
		self.assertIn("ブロックしました", response.json()["message"])

	def test_block_user_self(self):
		response = self.client.post(f"/{self.user.id}/block/", headers=self.headers)
		self.assertEqual(response.status_code, 400)
		self.assertIn("自分自身をブロックすることはできません", response.json()["message"])

	def test_unblock_user_success(self):
		user_to_block = User.objects.create_user(username="blockme2", email="blockme2@example.com", password="pass")
		Block.objects.create(blocker=self.user, blocked=user_to_block)
		response = self.client.post(f"/{user_to_block.id}/unblock/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		self.assertFalse(Block.objects.filter(blocker=self.user, blocked=user_to_block).exists())
		self.assertIn("ブロックを解除しました", response.json()["message"])

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
		self.assertIn("ブロックされています", response.json()["message"])

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
		self.assertIn("ブロックされています", response.json()["message"])

		# 両方False
		Block.objects.filter(blocker=other, blocked=self.user).delete()
		response = self.client.get(f"/{other.id}/", headers=self.headers)
		self.assertEqual(response.status_code, 200)
		data = response.json()
		self.assertFalse(data["blocking"])
		self.assertFalse(data["blocked"])

class PasswordResetAPITest(TestCase):
	def setUp(self):
		self.client = TestClient(router)
		self.user = User.objects.create_user(
			username="testuser",
			email="test@example.com",
			password="testpass123"
		)
		# キャッシュをクリア
		cache.clear()

	@patch('users.api.send_mail')
	def test_password_reset_request_success(self, mock_send_mail):
		"""パスワードリセット要求が成功することをテスト"""
		mock_send_mail.return_value = True
		
		data = {"email": "test@example.com"}
		response = self.client.post("/password-reset/", json=data)
		
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertIn("パスワードリセットコードを送信しました", response_data["message"])
		
		# メール送信が呼ばれたことを確認
		mock_send_mail.assert_called_once()
		call_args = mock_send_mail.call_args
		self.assertEqual(call_args[1]['recipient_list'], ['test@example.com'])
		self.assertIn("パスワードリセットコードのご案内", call_args[1]['subject'])
		
		# キャッシュにコードが保存されていることを確認
		cache_key = f"password_reset_test@example.com"
		cached_code = cache.get(cache_key)
		self.assertIsNotNone(cached_code)
		self.assertEqual(len(cached_code), 6)

	@patch('users.api.send_mail')
	def test_password_reset_request_nonexistent_user(self, mock_send_mail):
		"""存在しないユーザーのメールアドレスでも成功レスポンスを返すことをテスト"""
		data = {"email": "nonexistent@example.com"}
		response = self.client.post("/password-reset/", json=data)
		
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertIn("パスワードリセットコードを送信しました", response_data["message"])
		
		# メール送信は呼ばれない
		mock_send_mail.assert_not_called()

	@patch('users.api.send_mail')
	def test_password_reset_request_duplicate_email(self, mock_send_mail):
		"""同じメールアドレスを持つ複数のユーザーがいる場合のテスト"""
		mock_send_mail.return_value = True
		
		# 同じメールアドレスを持つ2つのユーザーを作成
		User.objects.create_user(
			username="user1",
			email="duplicate@example.com",
			password="pass1"
		)
		User.objects.create_user(
			username="user2",
			email="duplicate@example.com",
			password="pass2"
		)
		
		data = {"email": "duplicate@example.com"}
		response = self.client.post("/password-reset/", json=data)
		
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertIn("パスワードリセットコードを送信しました", response_data["message"])
		
		# メール送信が呼ばれたことを確認（最初のユーザーに対して）
		mock_send_mail.assert_called_once()

	@patch('users.api.send_mail')
	def test_password_reset_request_email_send_failure(self, mock_send_mail):
		"""メール送信に失敗した場合のエラーハンドリングをテスト"""
		mock_send_mail.side_effect = Exception("SMTP Error")
		
		data = {"email": "test@example.com"}
		response = self.client.post("/password-reset/", json=data)
		
		self.assertEqual(response.status_code, 400)
		response_data = response.json()
		self.assertIn("メール送信に失敗しました", response_data["message"])

	def test_password_reset_confirm_success(self):
		"""パスワードリセット確認が成功することをテスト"""
		# キャッシュにコードを保存
		test_code = "123456"
		cache_key = f"password_reset_test@example.com"
		cache.set(cache_key, test_code, 600)
		
		data = {
			"email": "test@example.com",
			"code": test_code,
			"new_password": "newpassword123"
		}
		response = self.client.post("/password-reset/confirm/", json=data)
		
		self.assertEqual(response.status_code, 200)
		response_data = response.json()
		self.assertIn("パスワードが正常にリセットされました", response_data["message"])
		
		# パスワードが実際に変更されたことを確認
		self.user.refresh_from_db()
		self.assertTrue(self.user.check_password("newpassword123"))
		
		# 使用済みコードがキャッシュから削除されていることを確認
		self.assertIsNone(cache.get(cache_key))

	def test_password_reset_confirm_invalid_code(self):
		"""無効なコードでのパスワードリセット確認をテスト"""
		# キャッシュにコードを保存
		test_code = "123456"
		cache_key = f"password_reset_test@example.com"
		cache.set(cache_key, test_code, 600)
		
		data = {
			"email": "test@example.com",
			"code": "654321",  # 間違ったコード
			"new_password": "newpassword123"
		}
		response = self.client.post("/password-reset/confirm/", json=data)
		
		self.assertEqual(response.status_code, 400)
		response_data = response.json()
		self.assertIn("無効なコードです", response_data["message"])

	def test_password_reset_confirm_expired_code(self):
		"""期限切れのコードでのパスワードリセット確認をテスト"""
		# キャッシュにコードを保存しない（期限切れをシミュレート）
		
		data = {
			"email": "test@example.com",
			"code": "123456",
			"new_password": "newpassword123"
		}
		response = self.client.post("/password-reset/confirm/", json=data)
		
		self.assertEqual(response.status_code, 400)
		response_data = response.json()
		self.assertIn("コードが期限切れまたは無効です", response_data["message"])

	def test_password_reset_confirm_nonexistent_user(self):
		"""存在しないユーザーのメールアドレスでのパスワードリセット確認をテスト"""
		data = {
			"email": "nonexistent@example.com",
			"code": "123456",
			"new_password": "newpassword123"
		}
		response = self.client.post("/password-reset/confirm/", json=data)
		
		self.assertEqual(response.status_code, 400)
		response_data = response.json()
		self.assertIn("無効なメールアドレスです", response_data["message"])