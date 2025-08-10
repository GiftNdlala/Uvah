from django.http import Http404
from django.shortcuts import get_object_or_404
from django.views.generic import TemplateView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Alert, AlertLocation
from .serializers import (
    AlertCreateSerializer,
    AlertResponseSerializer,
    LocationCreateSerializer,
)

class CreateAlertView(APIView):
    def post(self, request):
        serializer = AlertCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        alert = serializer.save()
        return Response(AlertResponseSerializer(alert, context={'request': request}).data, status=status.HTTP_201_CREATED)

class AlertLocationCreateView(APIView):
    def post(self, request, alert_id: int):
        alert = get_object_or_404(Alert, pk=alert_id)
        serializer = LocationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AlertLocation.objects.create(alert=alert, **serializer.validated_data)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)

class AlertDetailView(APIView):
    def get(self, request, alert_id: int):
        alert = get_object_or_404(Alert, pk=alert_id)
        data = AlertResponseSerializer(alert, context={'request': request}).data
        latest = alert.locations.order_by('-captured_at').first()
        if latest:
            data['latest_location'] = {
                'lat': latest.lat,
                'lon': latest.lon,
                'accuracy': latest.accuracy,
                'captured_at': latest.captured_at,
            }
        else:
            data['latest_location'] = None
        return Response(data)

class LiveViewLatestLocation(APIView):
    def get(self, request, token: str):
        try:
            alert = Alert.objects.get(live_view_token=token)
        except Alert.DoesNotExist:
            raise Http404
        latest = alert.locations.order_by('-captured_at').first()
        return Response({
            'status': alert.status,
            'alert_id': alert.id,
            'latest_location': None if latest is None else {
                'lat': latest.lat,
                'lon': latest.lon,
                'accuracy': latest.accuracy,
                'captured_at': latest.captured_at,
            }
        })

class LiveViewPage(TemplateView):
    template_name = 'live.html'

    def get_context_data(self, **kwargs):
        ctx = super().get_context_data(**kwargs)
        ctx['token'] = kwargs.get('token')
        return ctx