from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SimpleJWTAuthentication
from .location_utils import upsert_user_location
from .models import FriendRequest, Friendship, LiveShare, UserLocation, Notification, PushDevice
from .notify import notify_user
from .serializers import (
    FriendRequestSerializer,
    FriendshipDetailSerializer,
    PublicUserSerializer,
    LiveShareSerializer,
    UserLocationSerializer,
    NotificationSerializer,
)


User = get_user_model()


class UserSearchView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if not q:
            return User.objects.none()
        return User.objects.exclude(id=self.request.user.id).filter(username__icontains=q).order_by('username')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class SendFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def post(self, request):
        to_username = request.data.get('to_username', '').strip()
        if not to_username:
            return Response({'detail': 'to_username is required'}, status=400)
        try:
            to_user = User.objects.get(username__iexact=to_username)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=404)
        if to_user.id == request.user.id:
            return Response({'detail': 'Cannot friend yourself'}, status=400)
        fr, created = FriendRequest.objects.get_or_create(from_user=request.user, to_user=to_user)
        if not created and fr.status == 'pending':
            return Response({'detail': 'Request already sent'}, status=409)
        fr.status = 'pending'
        fr.save()

        if created or not Notification.objects.filter(
            user=to_user, notification_type='friend_request', related_entity_id=fr.id
        ).exists():
            notify_user(
                user=to_user,
                notification_type='friend_request',
                title='New Friend Request',
                message=f'@{request.user.username} sent you a friend request.',
                related_entity_id=fr.id,
            )

        return Response(FriendRequestSerializer(fr).data, status=201)


class IncomingRequestsView(generics.ListAPIView):
    serializer_class = FriendRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_queryset(self):
        return FriendRequest.objects.filter(to_user=self.request.user, status='pending').order_by('-created_at')


class RespondFriendRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    @transaction.atomic
    def post(self, request, request_id):
        action = request.data.get('action')
        try:
            fr = FriendRequest.objects.select_for_update().get(id=request_id, to_user=request.user)
        except FriendRequest.DoesNotExist:
            return Response({'detail': 'Request not found'}, status=404)
        if fr.status != 'pending':
            return Response({'detail': 'Request already processed'}, status=400)
        if action == 'accept':
            fr.status = 'accepted'
            fr.save()
            Friendship.objects.get_or_create(user=fr.from_user, friend=fr.to_user)
            Friendship.objects.get_or_create(user=fr.to_user, friend=fr.from_user)
            LiveShare.objects.update_or_create(
                owner=fr.from_user, viewer=fr.to_user, defaults={'is_active': True}
            )
            LiveShare.objects.update_or_create(
                owner=fr.to_user, viewer=fr.from_user, defaults={'is_active': True}
            )
            notify_user(
                user=fr.from_user,
                notification_type='friend_accept',
                title='Friend Request Accepted',
                message=f'@{request.user.username} accepted your friend request.',
                related_entity_id=fr.id,
            )
            return Response({'ok': True})
        if action == 'reject':
            fr.status = 'rejected'
            fr.save()
            return Response({'ok': True})
        return Response({'detail': 'Invalid action'}, status=400)


class FriendsListView(generics.ListAPIView):
    serializer_class = FriendshipDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_queryset(self):
        return Friendship.objects.filter(user=self.request.user).select_related('friend').order_by('friend__username')

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        friend_ids = Friendship.objects.filter(user=self.request.user).values_list('friend_id', flat=True)
        locations = UserLocation.objects.filter(user_id__in=friend_ids).select_related('user', 'user__account_profile')
        ctx['friend_locations'] = {loc.user_id: loc for loc in locations}
        return ctx


class ToggleLiveShareView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def post(self, request):
        viewer_username = request.data.get('viewer_username', '').strip()
        is_active = bool(request.data.get('is_active', True))
        if not viewer_username:
            return Response({'detail': 'viewer_username is required'}, status=400)
        try:
            viewer = User.objects.get(username__iexact=viewer_username)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=404)

        if not Friendship.objects.filter(user=request.user, friend=viewer).exists():
            return Response({'detail': 'Not friends'}, status=403)

        ls, _ = LiveShare.objects.get_or_create(owner=request.user, viewer=viewer)
        ls.is_active = is_active
        ls.save()

        payload = LiveShareSerializer(ls).data
        if is_active:
            try:
                loc = UserLocation.objects.get(user=request.user)
                payload['owner_last_location'] = UserLocationSerializer(loc, context={'request': request}).data
            except UserLocation.DoesNotExist:
                payload['owner_last_location'] = None
        return Response(payload)


class UpdateMyLocationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def post(self, request):
        lat = request.data.get('lat')
        lon = request.data.get('lon')
        accuracy = request.data.get('accuracy')
        if lat is None or lon is None:
            return Response({'detail': 'lat and lon are required'}, status=400)
        defaults = {'lat': float(lat), 'lon': float(lon)}
        if accuracy is not None:
            defaults['accuracy'] = float(accuracy)
        upsert_user_location(
            request.user,
            defaults['lat'],
            defaults['lon'],
            defaults.get('accuracy'),
        )
        return Response({'ok': True})


class FriendsLocationsView(generics.ListAPIView):
    serializer_class = UserLocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_queryset(self):
        friend_ids = Friendship.objects.filter(user=self.request.user).values_list('friend_id', flat=True)
        allowed_ids = LiveShare.objects.filter(viewer=self.request.user, is_active=True).values_list('owner_id', flat=True)
        allowed_friend_ids = set(friend_ids).intersection(set(allowed_ids))
        return (
            UserLocation.objects.filter(user_id__in=allowed_friend_ids)
            .select_related('user', 'user__account_profile')
            .order_by('user__username')
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')


class MarkNotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def post(self, request, notification_id):
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'ok': True})
        except Notification.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)


class RegisterPushTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    @transaction.atomic
    def post(self, request):
        token = str(request.data.get('token', '')).strip()
        device_id = str(request.data.get('device_id', '')).strip()
        platform = str(request.data.get('platform', '')).strip().lower()
        if not token or len(token) > 512:
            return Response({'detail': 'A valid push token is required.'}, status=400)
        if not device_id or len(device_id) > 128:
            return Response({'detail': 'A valid device_id is required.'}, status=400)
        if platform not in {PushDevice.PLATFORM_ANDROID, PushDevice.PLATFORM_IOS}:
            return Response({'detail': 'platform must be android or ios.'}, status=400)

        PushDevice.objects.filter(
            user=request.user,
            device_id=device_id,
        ).exclude(token=token).update(is_active=False)

        device, _ = PushDevice.objects.update_or_create(
            token=token,
            defaults={
                'user': request.user,
                'device_id': device_id,
                'platform': platform,
                'is_active': True,
            },
        )

        def deliver_pending():
            from .push import deliver_pending_for_user
            Notification.objects.filter(
                user=request.user,
                push_delivered_at__isnull=True,
            ).update(push_next_attempt_at=None)
            deliver_pending_for_user(request.user.id)

        transaction.on_commit(deliver_pending)
        return Response({
            'ok': True,
            'device_id': device.device_id,
            'platform': device.platform,
        })


class UnregisterPushTokenView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def post(self, request):
        token = str(request.data.get('token', '')).strip()
        if not token:
            return Response({'detail': 'token is required.'}, status=400)
        PushDevice.objects.filter(user=request.user, token=token).update(is_active=False)
        return Response({'ok': True})
