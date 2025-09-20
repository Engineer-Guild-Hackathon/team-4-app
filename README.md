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
- デモURL: 
  - Android: https://play.google.com/apps/internaltest/4701273649300930378（メールアドレスの登録が必要。[Google Form](https://docs.google.com/forms/d/e/1FAIpQLSeirQ-bB2txr7prz9riotsML00wQFot5F_KnVLNlK-KXq_01Q/viewform?usp=dialog) より登録をお願いします）
  - iOS: 審査中
- プレゼンURL：https://www.canva.com/design/DAGzTkaDnx4/4lzrxPDCpTMXWWQilUAo_Q/view?utm_content=DAGzTkaDnx4&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h0ad10a974d

---

<img width="1024" height="500" alt="Image" src="https://github.com/user-attachments/assets/93bcafbd-c56d-4c5d-8f09-25bc074b1b49" />


「匠 (Takumi)」は、学びの道のりをゲームのように可視化し、仲間や「ちょっと先の先輩」との繋がりを通じて成長できる、新しいソーシャルラーニング・プラットフォームです。

◆ 学びの全体像を「スキルツリー」で可視化
プログラミング、デザイン、語学など、専門分野の学習ロードマップを美しいスキルツリーとして可視化。今自分がどこにいて、次に何を学ぶべきかが一目でわかります。もう、情報の海で迷うことはありません。

◆ 「師弟関係」で、最適な学びを
ツリーの中で「ちょっと先の先輩」に弟子入りし、気軽に質問や相談ができます。専門家には聞きづらい初歩的な疑問も、身近な先輩が優しくサポート。あなたも成長すれば、後輩を導く「師匠」になることができます。

◆ モチベーションが続く仕組み
仲間や先輩の小さな成果がタイムラインに流れ、日々の学習意欲を刺激します。「あの人ができたなら、自分にもできるかも！」という感覚が、あなたの挑戦を後押しします。

【主な機能】
- トピックごとのインタラクティブなスキルツリー
- 師弟関係コミュニケーションスレッド機能
- 気づき・成果をシェアできる投稿機能

一人では続かない学習も、仲間や師匠とならもっと楽しく、もっと遠くまで進めるはず。「匠」で、あなたの可能性を最大限に引き出しませんか？



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
