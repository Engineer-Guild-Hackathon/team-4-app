from django.db import models
from django.conf import settings

from posts.models import Post
from topics.models import Topic


class Thread(models.Model):
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        verbose_name="トピック",
        related_name="threads",
    )
    starter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name="スレッド開始者",
        related_name="started_threads",
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name="メンター",
        related_name="mentored_threads",
    )
    related_post = models.ForeignKey(
        Post,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="関連投稿",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        verbose_name = "会話スレッド"
        verbose_name_plural = "会話スレッド"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Thread {self.id} in Topic {self.topic.title}"


class ThreadMessage(models.Model):
    thread = models.ForeignKey(
        Thread,
        on_delete=models.CASCADE,
        related_name="messages",
        verbose_name="スレッド",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="thread_messages",
        verbose_name="投稿者",
    )
    content = models.TextField(verbose_name="メッセージ内容", max_length=200)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        verbose_name="親メッセージ",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")

    class Meta:
        verbose_name = "スレッドメッセージ"
        verbose_name_plural = "スレッドメッセージ"
        ordering = ["created_at"]

    def __str__(self):
        return f"Message {self.id} by {self.author.username} in Thread {self.thread.id}"