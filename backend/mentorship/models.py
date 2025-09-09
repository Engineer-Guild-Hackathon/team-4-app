from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from topics.models import Topic


class MentorRelationRequest(models.Model):
    """師弟関係のリクエストを管理するモデル"""

    class Status(models.TextChoices):
        PENDING = 'pending', '申請中'
        APPROVED = 'approved', '承認済み'
        REJECTED = 'rejected', '拒否済み'

    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentor_requests_sent',
        verbose_name='申請元ユーザー'
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentor_requests_received',
        verbose_name='申請先ユーザー'
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='ステータス'
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='mentorship_requests',
        verbose_name='トピック'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')

    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.get_status_display()})"

    class Meta:
        verbose_name = '師弟関係リクエスト'
        verbose_name_plural = '師弟関係リクエスト'


class MentorRelation(models.Model):
    """師弟関係を管理するモデル"""
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentees',
        verbose_name='師匠'
    )
    # 一人のユーザーは同時に一人の師匠しか持てない想定
    mentee = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='mentor_relation',
        verbose_name='弟子'
    )
    rank = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='ランク',
        db_index=True
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='mentorship_relations',
        verbose_name='トピック'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='作成日時')

    def __str__(self):
        return f"Mentor: {self.mentor}, Mentee: {self.mentee}"

    class Meta:
        verbose_name = '師弟関係'
        verbose_name_plural = '師弟関係'