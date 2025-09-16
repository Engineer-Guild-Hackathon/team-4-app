from django.conf import settings
from django.db import models, connection
from topics.models import Topic


class MentorRelationRequest(models.Model):
    """師弟関係のリクエストを管理するモデル"""

    class Status(models.TextChoices):
        PENDING = "pending", "申請中"
        APPROVED = "approved", "承認済み"
        REJECTED = "rejected", "拒否済み"

    from_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentor_requests_sent",
        verbose_name="申請元ユーザー",
    )
    to_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentor_requests_received",
        verbose_name="申請先ユーザー",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="ステータス",
    )
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="mentorship_requests",
        verbose_name="トピック",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def __str__(self):
        return f"{self.from_user} -> {self.to_user} ({self.get_status_display()})"

    class Meta:
        verbose_name = "師弟関係リクエスト"
        verbose_name_plural = "師弟関係リクエスト"


class MentorRelationManager(models.Manager):
    """師弟関係のカスタムマネージャー"""

    def get_mentee_subtree(self, mentor_id):
        with connection.cursor() as cursor:
            cursor.execute(
                """
                WITH RECURSIVE mentee_tree AS (
                    SELECT
                        mr.mentee_id,
                        mr.mentor_id,
                        1 as level
                    FROM
                        mentorship_mentorrelation mr
                    WHERE
                        mr.mentor_id = %s
                    UNION ALL
                    SELECT
                        mr.mentee_id,
                        mr.mentor_id,
                        mt.level + 1
                    FROM
                        mentorship_mentorrelation mr
                    INNER JOIN
                        mentee_tree mt ON mr.mentor_id = mt.mentee_id
                )
                SELECT
                    auth_user.id,
                    auth_user.username,
                    auth_user.email,
                    mentee_tree.level
                FROM
                    mentee_tree
                INNER JOIN
                    auth_user ON mentee_tree.mentee_id = auth_user.id
                ORDER BY
                    mentee_tree.level, auth_user.username;
                """,
                [mentor_id],
            )
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]


class MentorRelation(models.Model):
    """師弟関係を管理するモデル"""

    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentees",
        verbose_name="師匠",
    )
    # 一人のユーザーは同時に一人の師匠しか持てない想定
    mentee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorships",
        verbose_name="弟子",
    )

    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name="mentorship_relations",
        verbose_name="トピック",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")

    objects = MentorRelationManager()

    def __str__(self):
        return f"Mentor: {self.mentor}, Mentee: {self.mentee}"

    class Meta:
        verbose_name = "師弟関係"
        verbose_name_plural = "師弟関係"
        unique_together = ("mentee", "topic")


class ActionLog(models.Model):
    ACTION_CHOICES = [
        ("graduate", "Graduate"),
        ("expel", "Expel"),
    ]

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="action_logs"
    )
    target = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="target_logs"
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor} {self.action} {self.target} at {self.created_at}"
