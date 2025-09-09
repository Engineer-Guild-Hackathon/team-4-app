from django.contrib import admin
from .models import Post

@admin.register(Post)
class TopicAdmin(admin.ModelAdmin):
    list_display = ('content', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('content',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)