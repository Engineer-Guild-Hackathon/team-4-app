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
from django.conf import settings
from django.conf.urls.static import static
from ninja import NinjaAPI
from ninja_jwt.routers.obtain import obtain_pair_router
from users.api import router as users_router
from topics.api import router as topics_router
from mentorship.api import router as mentorship_router
from posts.api import router as posts_router
from threads.api import router as threads_router
from reports.api import router as reports_router
from .health import health


api = NinjaAPI()
api.add_router("/token", tags=["Auth"], router=obtain_pair_router)
api.add_router("/posts", posts_router, tags=["Posts"])
api.add_router("/threads", threads_router, tags=["Threads"])
api.add_router("/users", users_router, tags=["Users"])
api.add_router("/topics", topics_router, tags=["Topics"])
api.add_router("/mentorship", mentorship_router, tags=["Mentorship"])
api.add_router("/reports", reports_router, tags=["Reports"])


urlpatterns = [
    path("/", health),
    path('admin/', admin.site.urls),
    path('api/', api.urls),
    path('health/', health),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
