from django.test import TestCase
import json


class OpenApiDocsTest(TestCase):
    def test_openapi_docs(self):
        response = self.client.get('/api/docs')
        self.assertEqual(response.status_code, 200)
        self.assertIn('text/html', response['Content-Type'])

class ProtectedTest(TestCase):
    def test_protected_unauthorized(self):
        response = self.client.get('/api/protected')
        self.assertEqual(response.status_code, 401)

    def test_protected_authorized(self):
        # ユーザー作成
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.create_user(username='testuser', password='testpass')
        # JWT取得
        response = self.client.post('/api/token/pair', data=json.dumps({'username': 'testuser', 'password': 'testpass'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        access = response.json().get('access')
        # JWT付きでアクセス
        auth_header = f'Bearer {access}'
        response = self.client.get('/api/protected', headers={'Authorization': auth_header})
        self.assertEqual(response.status_code, 200)
        self.assertIn('username', response.json())
        self.assertEqual(response.json()['username'], 'testuser')

class TokenPairTest(TestCase):
    def test_token_pair_invalid(self):
        response = self.client.post(
            '/api/token/pair',
            data=json.dumps({'username': 'invalid', 'password': 'invalid'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)
    
    def test_token_pair_valid(self):
        import json
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.create_user(username='validuser', password='validpass')
        response = self.client.post(
            '/api/token/pair',
            data=json.dumps({'username': 'validuser', 'password': 'validpass'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertIn('refresh', response.json())

class TokenRefreshTest(TestCase):
    def test_token_refresh_invalid(self):
        import json
        response = self.client.post(
            '/api/token/refresh',
            data=json.dumps({'refresh': 'invalidtoken'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 401)

    def test_token_refresh_valid_and_access_protected(self):
        import json
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.create_user(username='refreshuser', password='refreshpass')
        # JWT取得
        response = self.client.post(
            '/api/token/pair',
            data=json.dumps({'username': 'refreshuser', 'password': 'refreshpass'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        refresh = response.json().get('refresh')
        # リフレッシュで新しいアクセストークン取得
        response = self.client.post(
            '/api/token/refresh',
            data=json.dumps({'refresh': refresh}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        new_access = response.json().get('access')
        # 新しいアクセストークンでprotectedアクセス
        auth_header = f'Bearer {new_access}'
        response = self.client.get('/api/protected', HTTP_AUTHORIZATION=auth_header)
        self.assertEqual(response.status_code, 200)
        self.assertIn('username', response.json())
        self.assertEqual(response.json()['username'], 'refreshuser')
