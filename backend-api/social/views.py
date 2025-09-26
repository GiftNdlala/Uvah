from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.authentication import SimpleJWTAuthentication
from .models import FriendRequest, Friendship, LiveShare, UserLocation
from .serializers import FriendRequestSerializer, FriendshipSerializer, PublicUserSerializer, LiveShareSerializer, UserLocationSerializer


User = get_user_model()


class UserSearchView(generics.ListAPIView):
    serializer_class = PublicUserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if not q:
            return User.objects.none()
        return User.objects.filter(username__icontains=q)[:20]


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
        action = request.data.get('action')  # 'accept' or 'reject'
        try:
            fr = FriendRequest.objects.select_for_update().get(id=request_id, to_user=request.user)
        except FriendRequest.DoesNotExist:
            return Response({'detail': 'Request not found'}, status=404)
        if fr.status != 'pending':
            return Response({'detail': 'Request already processed'}, status=400)
        if action == 'accept':
            fr.status = 'accepted'
            fr.save()
            # Create mutual friendships
            Friendship.objects.get_or_create(user=fr.from_user, friend=fr.to_user)
            Friendship.objects.get_or_create(user=fr.to_user, friend=fr.from_user)
            return Response({'ok': True})
        elif action == 'reject':
            fr.status = 'rejected'
            fr.save()
            return Response({'ok': True})
        else:
            return Response({'detail': 'Invalid action'}, status=400)


class FriendsListView(generics.ListAPIView):
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_queryset(self):
        return Friendship.objects.filter(user=self.request.user).select_related('friend').order_by('friend__username')


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
        return Response(LiveShareSerializer(ls).data)


class UpdateMyLocationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def post(self, request):
        lat = request.data.get('lat')
        lon = request.data.get('lon')
        accuracy = request.data.get('accuracy')
        if lat is None or lon is None:
            return Response({'detail': 'lat and lon are required'}, status=400)
        loc, _ = UserLocation.objects.get_or_create(user=request.user)
        loc.lat = float(lat)
        loc.lon = float(lon)
        if accuracy is not None:
            loc.accuracy = float(accuracy)
        loc.save()
        return Response({'ok': True})


class FriendsLocationsView(generics.ListAPIView):
    serializer_class = UserLocationSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_queryset(self):
        friend_ids = Friendship.objects.filter(user=self.request.user).values_list('friend_id', flat=True)
        # Only include friends who have granted live share to requester
        allowed_ids = LiveShare.objects.filter(viewer=self.request.user, is_active=True).values_list('owner_id', flat=True)
        allowed_friend_ids = set(friend_ids).intersection(set(allowed_ids))
        return UserLocation.objects.filter(user_id__in=allowed_friend_ids)

