from django.urls import path
from .views import CreateAlertView, AlertLocationCreateView, AlertDetailView, LiveViewLatestLocation

urlpatterns = [
    path('alerts', CreateAlertView.as_view(), name='create-alert'),
    path('alerts/<int:alert_id>/locations', AlertLocationCreateView.as_view(), name='create-location'),
    path('alerts/<int:alert_id>', AlertDetailView.as_view(), name='alert-detail'),
    path('live/<str:token>/latest', LiveViewLatestLocation.as_view(), name='live-latest'),
]