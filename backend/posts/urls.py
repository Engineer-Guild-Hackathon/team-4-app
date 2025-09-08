from django.urls import path
from .views import PostCreateAPIView

urlpatterns = [
    path('', PostCreateAPIView.as_view(), name='post-create'),
]