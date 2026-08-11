from django.urls import path
from .views import (
    CreateAlertView,
    AlertLocationCreateView,
    AlertDetailView,
    LiveViewLatestLocation,
    MyAlertsListView,
    CancelAlertView,
)

urlpatterns = [
    path('alerts', CreateAlertView.as_view(), name='create-alert'),
    path('alerts/my-alerts/', MyAlertsListView.as_view(), name='my-alerts'),
    path('alerts/<int:alert_id>/cancel/', CancelAlertView.as_view(), name='cancel-alert'),
    path('alerts/<int:alert_id>/locations', AlertLocationCreateView.as_view(), name='create-location'),
    path('alerts/<int:alert_id>', AlertDetailView.as_view(), name='alert-detail'),
    path('live/<str:token>/latest', LiveViewLatestLocation.as_view(), name='live-latest'),
]
