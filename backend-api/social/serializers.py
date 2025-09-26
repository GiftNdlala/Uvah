from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import FriendRequest, Friendship, LiveShare


User = get_user_model()


class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']


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


class LiveShareSerializer(serializers.ModelSerializer):
    owner = PublicUserSerializer(read_only=True)
    viewer = PublicUserSerializer(read_only=True)

    class Meta:
        model = LiveShare
        fields = ['id', 'owner', 'viewer', 'is_active', 'created_at']

