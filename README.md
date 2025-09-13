# ハッカソン提出用リポジトリ

## チーム情報
- チーム番号: 4
- チーム名: 29番目の天ぷら
- プロダクト名: 匠 -takumi-
- メンバー: 
   - 淨慶 航太 (jk99k)
   - 疋田 智佳子 (c-hikita)
   - 中薗 悠太 (zono-nozo)
   - 阿部 勝寿 (Masa-eba)
---

## デモ/プレゼン資料
- デモURL: ネイティブアプリのためなし
- プレゼンURL：https://www.canva.com/design/DAGyeXmhYFI/bC4jgNEk4sv7SIKyjCIbhw/view?utm_content=DAGyeXmhYFI&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=habd0cede2e

---
## フロントエンド環境構築

### 必要なもの
- Node.js（推奨: 最新のLTS版）
- npm または yarn
- Expo CLI（グローバルインストール推奨）

### セットアップ手順
1. 依存パッケージのインストール
   ```sh
   cd frontend
   npm install
   # または
   yarn install
   ```
2. Expo CLIのインストール（未インストールの場合）
   ```sh
   npm install -g expo-cli
   ```
3. 開発サーバーの起動
   ```sh
   npm start
   # または
   yarn start
   # または
   expo start
   ```
4. ブラウザで表示されるQRコードをスマホのExpo Goアプリで読み込むと、実機で動作確認できます。

### 補足
- `assets/`配下に画像やフォントがあります。
- TypeScript, React Native, Expoを利用しています。
- `.env`ファイルが必要な場合は適宜作成してください。

---

## バックエンド環境構築

### 必要なもの
- Docker / Docker Compose
- Python 3.12（venvは任意）
- git

### 初期セットアップ手順
1. リポジトリをクローン
   ```sh
   git clone <このリポジトリURL>
   cd team-4-app/backend
   ```
2. `.env` ファイルを編集（必要なら）
   - DB接続情報などは `.env` に記載済み
3. Dockerコンテナの起動
   ```sh
   docker compose up -d --build
   ```
4. Djangoマイグレーション
   ```sh
   docker compose exec api python manage.py migrate
   ```
5. ヘルスチェック
   - API: `http://localhost:8000/health/` にアクセスし、`{"status": "ok"}` が返ればOK
   - DB: `docker compose ps` で `db` サービスが `healthy` になっていればOK

### 開発の流れ
- コード変更後は `docker compose restart api` で反映
- 必要に応じて `docker compose down -v` でDB初期化

### 主要ファイル
- `compose.yml` … Dockerサービス定義
- `.env` … 環境変数（DB接続情報など）
- `config/settings.py` … Django設定
- `config/urls.py` … ルーティング
- `config/health.py` … ヘルスチェックAPI

### よくあるトラブル
- DB接続エラー → `.env` の値と `compose.yml` の `env_file` 設定を確認
- マイグレーション失敗 → DBコンテナのログを確認

---

## ネットワーク設定方法
開発環境でスマートフォン実機など、PC以外の端末からAPIに接続するには、ネットワーク設定が必要です。
 
PCとスマートフォンを同じWi-Fiネットワークに接続した上で、PCのローカルIPアドレスを使ってフロントエンドとバックエンドを連携させます。
 
1. バックエンドの設定
バックエンドのルートディレクトリ (backend/) に .env ファイルを新規作成し、以下の内容を記述します。
   ```
   DJANGO_ALLOWED_HOSTS="<あなたのIPアドレス>,localhost"
   ```
 
2. フロントエンドの設定
フロントエンドのルートディレクトリ (frontend/) に .env ファイルを新規作成し、以下の内容を記述します。
   ```
   EXPO_PUBLIC_API_URL="http://<あなたのIPアドレス>:8000"
   ```