import json
from ninja import Router, File, Form
from ninja.files import UploadedFile
from typing import List
from .models import Post, PostMedia
from .schemas import PostOut
from django.db import transaction

# postsアプリ用のルーターを作成
router = Router()

@router.post("/", response=PostOut)
@transaction.atomic
def create_post(request, 
                content: str = Form(...), 
                files: List[UploadedFile] = File(...), 
                metadata: str = Form(...)): # metadataという名前でJSON文字列を受け取る
    """
    コンテンツ、複数のファイル、そして各ファイルのメタデータ(JSON文字列)を受け取り投稿を作成
    """
    post = Post.objects.create(content=content)
    
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