from django.contrib import admin
from .models import Post, PostMedia

# Postの編集画面内でPostMediaを表示するための設定
class PostMediaInline(admin.TabularInline):
    model = PostMedia
    extra = 1
    readonly_fields = ('id',)

# Postモデルの管理画面設定
@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('id', 'content', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('content',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    inlines = [PostMediaInline]