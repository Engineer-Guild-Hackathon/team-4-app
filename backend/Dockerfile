
# ベースイメージ
FROM python:3.12-slim

RUN apt-get update && apt-get install -y curl

WORKDIR /app

# 依存関係ファイルのコピー
COPY requirements.txt ./

# 依存関係のインストール
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのソースコードをコピー
COPY . .

EXPOSE 8000

CMD ["gunicorn", "--bind", ":8000", "config.wsgi"]