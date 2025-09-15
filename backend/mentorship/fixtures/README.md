# Mentorship Fixtures

このディレクトリには師匠選択機能のテスト用モックデータが含まれています。

## ファイル一覧

### `mentorship_test_data.json`

基本的な師匠選択機能のテスト用データ

- ユーザー: mentor_user (師匠), mentee_user (弟子), senior_mentor (上級師匠)
- トピック: Python プログラミング, JavaScript 開発
- 師弟関係、リクエストのサンプルデータ

### `mentor_selection_scenarios.json`

師匠選択判定の様々なシナリオ用データ

- シナリオユーザー 1-3
- 師匠選択テストトピック
- 師弟関係、保留中のリクエストのテストケース

### `tree_test_data.json`

既存のツリー構造テスト用データ

## 使用方法

### テストでフィクスチャを読み込む

```python
from django.test import TestCase

class MyTestCase(TestCase):
    fixtures = ['mentorship_test_data.json']

    def test_something(self):
        # フィクスチャのデータを使用
        pass
```

### 管理コマンドでフィクスチャを読み込む

```bash
python manage.py loaddata mentorship_test_data.json
```

## データ構造

### ユーザー

- `mentor_user`: 師匠役のユーザー
- `mentee_user`: 弟子役のユーザー
- `senior_mentor`: 上級師匠のユーザー

### トピック

- `Pythonプログラミング`: 基本的なプログラミング学習トピック
- `JavaScript開発`: フロントエンド開発トピック

### 師弟関係

- 既存の師弟関係のサンプル
- 保留中のリクエストのサンプル

## 注意事項

- パスワードはテスト用のハッシュ値を使用
- 日付は固定値（2025-09-15）を使用
- 実際の本番環境では使用しないでください
