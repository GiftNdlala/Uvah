from django.contrib import admin
from django.urls import path, include
from alerts.views import LiveViewPage

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('alerts.urls')),
    path('live/<str:token>/', LiveViewPage.as_view(), name='live-view'),
]