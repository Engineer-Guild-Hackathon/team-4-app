from django.db import models
from django.contrib.auth.models import User
import uuid


class Topic(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False,verbose_name="ID")
    title = models.CharField(max_length=200, verbose_name="タイトル")
    description = models.TextField(blank=True, verbose_name="説明")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")
    users = models.ManyToManyField(User, through='UserTopic', related_name='topics', verbose_name="関連ユーザー")

    class Meta:
        # モデルの名前表示を日本語に設定
        verbose_name = "トピック"
        verbose_name_plural = "トピック"
        # 作成日時の降順で並べる
        ordering = ['-created_at']

    #トピックのタイトルを返す
    def __str__(self):
        return self.title


class UserTopic(models.Model):
    """ユーザーとトピックの中間テーブル"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="ユーザー")
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, verbose_name="トピック")
    level = models.IntegerField(default=1, verbose_name="レベル")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="参加日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")
    
    class Meta:
        unique_together = ('user', 'topic')
        verbose_name = "ユーザー-トピック関連"
        verbose_name_plural = "ユーザー-トピック関連"

    def __str__(self):
        return f"{self.user.username} - {self.topic.title}"