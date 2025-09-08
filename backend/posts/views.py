import re
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from .models import Post
from .serializers import PostSerializer

class PostCreateAPIView(generics.CreateAPIView):
    """投稿を作成するためのAPIビュー"""
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    parser_classes = (MultiPartParser, FormParser)

    def create(self, request, *args, **kwargs):
        
        # 'content' など、単純なフィールドを先に取得
        data_dict = {'content': request.data.get('content')}
        
        media_items = {}
        # 'media[0].media_type' のようなキーを解析
        for key, value in request.data.items():
            match = re.match(r'media\[(\d+)\]\.(.+)', key)
            if match:
                index = int(match.group(1))
                field = match.group(2)
                
                # インデックスごとに辞書を作成
                if index not in media_items:
                    media_items[index] = {}
                media_items[index][field] = value
        
        # 組み立てたメディアデータをリストに変換して追加
        data_dict['media'] = [item for _, item in sorted(media_items.items())]
        
        # 組み立てたデータを使って、通常のシリアライザー処理を実行        
        serializer = self.get_serializer(data=data_dict)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)