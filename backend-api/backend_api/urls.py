from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from alerts.views import LiveViewPage
from django.http import JsonResponse

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('alerts.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/social/', include('social.urls')),
    path('live/<str:token>/', LiveViewPage.as_view(), name='live-view'),
    path('health', lambda request: JsonResponse({'status': 'ok'})),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
