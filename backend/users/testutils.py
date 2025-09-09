from ninja.testing import TestClient
from ninja_jwt.tokens import RefreshToken

def get_jwt_auth_headers(user):
    """
    テスト用: DjangoユーザーからJWTトークンを生成し、Authorizationヘッダーを返す
    例: headers = get_jwt_auth_headers(user)
         client.get('/api/xxx', headers=headers)
    """
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    return {"Authorization": f"Bearer {access_token}"}
