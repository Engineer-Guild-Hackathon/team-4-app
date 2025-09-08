from django.db import models
import uuid


class Topic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,verbose_name="ID")
    title = models.CharField(max_length=200, verbose_name="タイトル")
    description = models.TextField(blank=True, verbose_name="説明")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        # モデルの名前表示を日本語に設定
        verbose_name = "トピック"
        verbose_name_plural = "トピック"
        # 作成日時の降順で並べる
        ordering = ['-created_at']

    #トピックのタイトルを返す
    def __str__(self):
        return self.title