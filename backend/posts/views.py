from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Post
from .serializers import PostSerializer

class PostCreateAPIView(generics.CreateAPIView):
    """投稿を作成するためのAPIビュー"""
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    # ファイルアップロードを扱うためにパーサーを設定
    parser_classes = (MultiPartParser, FormParser)