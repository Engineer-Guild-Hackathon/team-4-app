from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator

class CustomUser(AbstractUser):
    rank = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        verbose_name='ランク'
    )

    class Meta:
        verbose_name = 'ユーザー'
        verbose_name_plural = 'ユーザー'
