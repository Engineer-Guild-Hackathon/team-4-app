from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

class Report(models.Model):
	reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
	reason = models.CharField(max_length=100)
	content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
	object_id = models.PositiveIntegerField()
	content_object = GenericForeignKey('content_type', 'object_id')
	created_at = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.reporter} reports {self.content_object} ({self.reason})"