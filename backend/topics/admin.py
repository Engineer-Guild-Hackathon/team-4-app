from django.contrib import admin
from .models import Topic, UserTopic


@admin.register(Topic)
class TopicAdmin(admin.ModelAdmin):
    list_display = ("title", "created_at", "updated_at")
    list_filter = ("created_at", "updated_at")
    search_fields = ("title", "description")
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)


@admin.register(UserTopic)
class UserTopicAdmin(admin.ModelAdmin):
    list_display = ("user", "topic", "level", "created_at")
    list_filter = ("topic",)
    search_fields = ("user__username", "topic__title")
