from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
	list_display = ("id", "reporter", "reason", "content_type", "object_id", "created_at")
	search_fields = ("reason", "reporter__username")
	list_filter = ("content_type", "created_at")

# Register your models here.
