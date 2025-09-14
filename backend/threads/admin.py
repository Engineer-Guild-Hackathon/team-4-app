from django.contrib import admin
from .models import Thread, ThreadMessage

admin.site.register(Thread)
admin.site.register(ThreadMessage)