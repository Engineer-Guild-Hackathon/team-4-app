"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from ninja import NinjaAPI
from ninja_jwt.routers.obtain import obtain_pair_router
from ninja_jwt.authentication import JWTAuth
from .health import health


api = NinjaAPI()
api.add_router("/token", tags=["Auth"], router=obtain_pair_router)


from .health import health
from topics.views import router as topics_router

api.add_router("/topics", topics_router, tags=["Topics"])

# 保護されたAPIサンプル（削除予定）
@api.get("/protected", auth=JWTAuth())
def protected(request):
    return {"username": request.user.username, "message": "JWT認証OK"}

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
    path('health/', health),
]
