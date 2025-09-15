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
