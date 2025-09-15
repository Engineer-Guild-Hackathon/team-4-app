from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'プロフィール'

class CustomUserAdmin(UserAdmin):    
    def get_inlines(self, request, obj=None):
        if obj:
            return (UserProfileInline,)
        else:
            return ()

admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
