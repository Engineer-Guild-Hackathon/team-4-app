# ハッカソン提出用リポジトリ

このリポジトリはハッカソン提出用の雛形です。以下の項目をすべて埋めてください。

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

## フロントエンド・バックエンドの接続について

Expo/React Native（フロント）からDjango（バックエンド）APIに接続する場合、
**自分のPCや端末が接続しているネットワークのIPアドレス**を `frontend/utils/apiClient.ts:15` の `BASE_URL` の末尾、 `backend/.env` の `DJANGO_ALLOWED_HOSTS` などに追加する必要があります。

これを設定しないと、スマホ実機や他端末からAPIにアクセスできません。

IPアドレスはネットワーク環境によって変わるため、接続時は必ずご自身のIPを確認し、各設定ファイルに反映してください。

---

## チーム情報
- チーム番号: （ここに記入）
- チーム名: （ここに記入）
- プロダクト名: （ここに記入）
- メンバー: （GitHubアカウントまたは名前を列挙）

---

## デモ　/ プレゼン資料
- デモURL: 
- プレゼンURL：
