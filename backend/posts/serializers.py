from rest_framework import serializers
from .models import Post, PostMedia

class PostMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostMedia
        fields = ['media_type', 'file']

class PostSerializer(serializers.ModelSerializer):
    # ネストした書き込みを許可するための設定
    media = PostMediaSerializer(many=True)

    class Meta:
        model = Post
        fields = ['id', 'content', 'media', 'created_at']

    def create(self, validated_data):
        # 'media' のデータを取り出す
        media_data = validated_data.pop('media')

        # 先に Post オブジェクトを作成
        post = Post.objects.create(**validated_data)

        # 取り出した media_data を使って PostMedia オブジェクトを複数作成
        for medium_data in media_data:
            PostMedia.objects.create(post=post, **medium_data)

        return post