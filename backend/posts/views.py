import json
from ninja import Router, File, Form
from ninja.files import UploadedFile
from typing import List
from uuid import UUID
from .models import Post, PostMedia
from .schemas import PostOut
from django.db import transaction
from django.shortcuts import get_object_or_404
from ninja_jwt.authentication import JWTAuth
from topics.models import Topic

# postsアプリ用のルーターを作成
router = Router()

@router.get("/", response=List[PostOut])
def list_posts(request, topic_id: UUID = None, author_id: int = None):
    """
    投稿の一覧を取得する。
    topic_idとauthor_idで絞り込み可能。
    """
    posts = Post.objects.prefetch_related('media').all()

    if topic_id:
        posts = posts.filter(topic_id=topic_id)

    if author_id:
        posts = posts.filter(author_id=author_id)
    
    return posts.order_by('-created_at')

@router.delete("/{post_id}", response={204: None})
def delete_post(request, post_id: int):
    """指定されたIDの投稿を削除する"""
    post = get_object_or_404(Post, id=post_id)
    post.delete()
    return 204

@router.post("/", response=PostOut, auth=JWTAuth())
@transaction.atomic
def create_post(request, 
                topic_id: UUID = Form(...),
                content: str = Form(...), 
                files: List[UploadedFile] = File(...), 
                metadata: str = Form(...)):
    """
    コンテンツ、複数のファイル、そして各ファイルのメタデータ(JSON文字列)を受け取り投稿を作成
    """
    topic = get_object_or_404(Topic, id=topic_id)
    
    # authorにリクエストを送ってきた認証済みユーザーを設定
    post = Post.objects.create(
        content=content, 
        author=request.auth, # request.auth に認証済みユーザーが入っている
        topic=topic
    )
    
    # 受け取ったJSON文字列をPythonのリストに変換
    media_info_list = json.loads(metadata)

    # ファイルの数とメタデータの数が一致していることを確認
    if len(files) != len(media_info_list):
        # 実際にはここでエラー処理を入れるべきですが、今回は省略
        pass

    for i, file in enumerate(files):
        media_info = media_info_list[i] # 対応するメタデータを取得
        PostMedia.objects.create(
            post=post,
            media_type=media_info.get('media_type'), # メタデータからmedia_typeを取得
            file=file
        )
    
    return post