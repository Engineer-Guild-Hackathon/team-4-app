from django.db import models
from django.conf import settings

class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='profile',
        verbose_name='ユーザー'
    )
    bio = models.TextField(
        '自己紹介', 
        null=True, 
        blank=True
    )
    avatar = models.ImageField(
        'アバター画像', 
        upload_to='avatars/', 
        null=True, 
        blank=True
    )

    def __str__(self):
        return self.user.username
    

class Block(models.Model):
    blocker = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='blocked',
        verbose_name='ブロッカー'
    )
    blocked = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='blocked_by',
        verbose_name='ブロックされたユーザー'
    )
    created_at = models.DateTimeField(
        '作成日時', 
        auto_now_add=True
    )

    class Meta:
        unique_together = ('blocker', 'blocked')
        verbose_name = 'ブロック'
        verbose_name_plural = 'ブロック'

    def __str__(self):
        return f"{self.blocker} blocked {self.blocked}"
