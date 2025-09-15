from django.db import models
from django.conf import settings
import uuid


class Topic(models.Model):
    id = models.UUIDField(
        primary_key=True, default=uuid.uuid4, editable=False, verbose_name="ID"
    )
    title = models.CharField(max_length=200, verbose_name="タイトル")
    description = models.TextField(blank=True, verbose_name="説明")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")
    users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="UserTopic",
        related_name="topics",
        verbose_name="関連ユーザー",
    )

    class Meta:
        # モデルの名前表示を日本語に設定
        verbose_name = "トピック"
        verbose_name_plural = "トピック"
        # 作成日時の降順で並べる
        ordering = ["-created_at"]

    # トピックのタイトルを返す
    def __str__(self):
        return self.title


class UserTopic(models.Model):
    """ユーザーとトピックの中間テーブル"""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "アクティブ"
        GRADUATED = "GRADUATED", "卒業済み"
        EXPELLED = "EXPELLED", "破門済み"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, verbose_name="ユーザー"
    )
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE, verbose_name="トピック")
    level = models.IntegerField(default=1, verbose_name="レベル")
    mentee_capacity = models.IntegerField(default=3, verbose_name="弟子定員")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="参加日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.ACTIVE, 
        verbose_name="ステータス"
    )

    class Meta:
        unique_together = ("user", "topic")
        verbose_name = "ユーザー-トピック関連"
        verbose_name_plural = "ユーザー-トピック関連"

    def __str__(self):
        return f"{self.user.username} - {self.topic.title}"
