from django.http import Http404
from django.shortcuts import get_object_or_404
from django.views.generic import TemplateView
from django.db import transaction
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SimpleJWTAuthentication
from .models import Alert, AlertLocation
from .serializers import (
    AlertCreateSerializer,
    AlertResponseSerializer,
    LocationCreateSerializer,
)

class CreateAlertView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def post(self, request):
        serializer = AlertCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # An SOS is only useful if its recipients can immediately see a real
        # location.  Save the first GPS point before notifying friends.
        initial_location = request.data.get('initial_location')
        initial_location_serializer = None
        if serializer.validated_data.get('severity_level', 1) >= 2:
            if not initial_location:
                return Response({'detail': 'A current location is required to start an SOS.'}, status=status.HTTP_400_BAD_REQUEST)
            location_serializer = LocationCreateSerializer(data=initial_location)
            location_serializer.is_valid(raise_exception=True)
            initial_location_serializer = location_serializer

        with transaction.atomic():
            alert = serializer.save(user=request.user)
            if initial_location_serializer:
                AlertLocation.objects.create(alert=alert, **initial_location_serializer.validated_data)

        try:
            from social.notify import notify_friends_checkin, notify_friends_sos

            if alert.severity_level >= 2:
                notify_friends_sos(request.user, alert)
            else:
                notify_friends_checkin(request.user, alert)
        except Exception:
            pass

        return Response(AlertResponseSerializer(alert, context={'request': request}).data, status=status.HTTP_201_CREATED)

class AlertLocationCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, alert_id: int):
        alert = get_object_or_404(Alert, pk=alert_id, user=request.user)
        if alert.status != Alert.STATUS_ACTIVE:
            return Response({'detail': 'Cannot post location to a non-active alert'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = LocationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        AlertLocation.objects.create(alert=alert, **serializer.validated_data)
        return Response({"ok": True}, status=status.HTTP_201_CREATED)

class AlertDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, alert_id: int):
        alert = get_object_or_404(Alert, pk=alert_id)
        if alert.user_id != request.user.id:
            from social.models import Friendship

            is_friend = Friendship.objects.filter(user=request.user, friend=alert.user).exists()
            if not is_friend:
                return Response({'detail': 'You do not have access to this alert.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(AlertResponseSerializer(alert, context={'request': request}).data)


class MyAlertsListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        status_filter = request.query_params.get('status', '').strip().lower()
        queryset = Alert.objects.filter(user=request.user).order_by('-created_at')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        payload = AlertResponseSerializer(queryset, many=True, context={'request': request}).data
        return Response(payload)


class CancelAlertView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, alert_id: int):
        alert = get_object_or_404(Alert, pk=alert_id, user=request.user)
        if alert.status == Alert.STATUS_ACTIVE:
            alert.status = Alert.STATUS_CANCELED
            alert.save(update_fields=['status'])
        return Response(AlertResponseSerializer(alert, context={'request': request}).data)

class LiveViewLatestLocation(APIView):
    permission_classes = [permissions.AllowAny]

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
