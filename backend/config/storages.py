from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class Storage(S3Boto3Storage):
    bucket_name = settings.CLOUDFLARE_R2_BUCKET_NAME

    location = "media"

    file_overwrite = True
