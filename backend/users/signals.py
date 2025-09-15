from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import UserProfile

User = settings.AUTH_USER_MODEL

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    新しいユーザーが作成されたら、空のプロフィールも作成する。
    既存のユーザーが更新された場合は、プロフィールも保存する。
    """
    if created:
        UserProfile.objects.create(user=instance)
    instance.profile.save()
