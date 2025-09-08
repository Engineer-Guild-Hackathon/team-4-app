from django.db import models

class Post(models.Model):
    """投稿モデル"""
    content = models.TextField("投稿内容")
    created_at = models.DateTimeField("作成日時", auto_now_add=True)
    updated_at = models.DateTimeField("更新日時", auto_now=True)

    def __str__(self):
        return f"Post ID: {self.id}"

class PostMedia(models.Model):
    """投稿メディアモデル"""
    class MediaType(models.TextChoices):
        IMAGE = 'image', '画像'
        VIDEO = 'video', '動画'

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='media', verbose_name="投稿")
    media_type = models.CharField("メディアタイプ", max_length=10, choices=MediaType.choices)
    file = models.FileField("メディアファイル", upload_to='posts_media/')

    def __str__(self):
        return f"{self.get_media_type_display()} for Post {self.post.id}"