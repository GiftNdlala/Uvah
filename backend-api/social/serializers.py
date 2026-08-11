from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import serializers
from accounts.avatar_utils import get_avatar_url
from .models import FriendRequest, Friendship, LiveShare, UserLocation, Notification


User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar_url']

    def get_avatar_url(self, obj):
        return get_avatar_url(obj, self.context.get('request'))


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = PublicUserSerializer(read_only=True)
    to_user = PublicUserSerializer(read_only=True)

    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'to_user', 'status', 'created_at']


class FriendshipSerializer(serializers.ModelSerializer):
    friend = PublicUserSerializer(read_only=True)

    class Meta:
        model = Friendship
        fields = ['id', 'friend', 'created_at']


class FriendshipDetailSerializer(serializers.ModelSerializer):
    friend = PublicUserSerializer(read_only=True)
    is_sharing_with_friend = serializers.SerializerMethodField()
    is_sharing_with_me = serializers.SerializerMethodField()
    last_location = serializers.SerializerMethodField()
    location_label = serializers.SerializerMethodField()

    class Meta:
        model = Friendship
        fields = [
            'id',
            'friend',
            'created_at',
            'is_sharing_with_friend',
            'is_sharing_with_me',
            'last_location',
            'location_label',
        ]

    def _live_share_map(self):
        if not hasattr(self, '_ls_cache'):
            request = self.context.get('request')
            user = request.user if request else None
            outgoing = {}
            incoming = {}
            if user:
                for ls in LiveShare.objects.filter(owner=user).select_related('viewer'):
                    outgoing[ls.viewer_id] = ls.is_active
                for ls in LiveShare.objects.filter(viewer=user).select_related('owner'):
                    incoming[ls.owner_id] = ls.is_active
            self._ls_cache = (outgoing, incoming)
        return self._ls_cache

    def _friend_location(self, friend_id):
        locations = self.context.get('friend_locations') or {}
        return locations.get(friend_id)

    def get_is_sharing_with_friend(self, obj):
        outgoing, _ = self._live_share_map()
        return bool(outgoing.get(obj.friend_id))

    def get_is_sharing_with_me(self, obj):
        _, incoming = self._live_share_map()
        return bool(incoming.get(obj.friend_id))

    def get_last_location(self, obj):
        loc = self._friend_location(obj.friend_id)
        if not loc:
            return None
        return UserLocationSerializer(loc).data

    def get_location_label(self, obj):
        outgoing, incoming = self._live_share_map()
        sharing_out = bool(outgoing.get(obj.friend_id))
        sharing_in = bool(incoming.get(obj.friend_id))
        loc = self._friend_location(obj.friend_id)

        statuses = []
        if sharing_out:
            statuses.append("You are sharing")
        
        if sharing_in and loc:
            age = timezone.now() - loc.updated_at
            if age > timedelta(minutes=15):
                statuses.append(f"Friend seen {loc.updated_at.strftime('%H:%M')}")
            else:
                statuses.append(f"Friend live {loc.updated_at.strftime('%H:%M')}")
        elif sharing_in:
            statuses.append("Friend sharing (waiting location)")
        else:
            statuses.append("Friend location hidden")

        return " · ".join(statuses)


class LiveShareSerializer(serializers.ModelSerializer):
    owner = PublicUserSerializer(read_only=True)
    viewer = PublicUserSerializer(read_only=True)

    class Meta:
        model = LiveShare
        fields = ['id', 'owner', 'viewer', 'is_active', 'created_at']


class UserLocationSerializer(serializers.ModelSerializer):
    user = PublicUserSerializer(read_only=True)
    is_stale = serializers.SerializerMethodField()

    class Meta:
        model = UserLocation
        fields = ['user', 'lat', 'lon', 'accuracy', 'updated_at', 'is_stale']

    def get_is_stale(self, obj):
        return timezone.now() - obj.updated_at > timedelta(minutes=15)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'is_read', 'related_entity_id', 'created_at']

