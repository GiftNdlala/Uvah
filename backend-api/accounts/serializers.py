from django.contrib.auth import get_user_model, authenticate
from rest_framework import serializers
from .models import AccountProfile
from .avatar_utils import get_avatar_url


User = get_user_model()


class RegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Username already taken')
        return value

    def create(self, validated_data):
        user = User(username=validated_data['username'])
        user.set_password(validated_data['password'])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        user = authenticate(username=username, password=password)
        if not user:
            raise serializers.ValidationError('Invalid credentials')
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')
        attrs['user'] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    emergency_contact = serializers.SerializerMethodField()
    emergency_contact_phone = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'emergency_contact', 'emergency_contact_phone', 'avatar_url',
        ]

    def get_avatar_url(self, obj):
        return get_avatar_url(obj, self.context.get('request'))

    def get_emergency_contact(self, obj):
        profile = getattr(obj, 'account_profile', None)
        return profile.emergency_contact if profile else ''

    def get_emergency_contact_phone(self, obj):
        profile = getattr(obj, 'account_profile', None)
        return profile.emergency_contact_phone if profile else ''


class ProfileSerializer(serializers.ModelSerializer):
    emergency_contact = serializers.CharField(required=False, allow_blank=True)
    emergency_contact_phone = serializers.CharField(required=False, allow_blank=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'emergency_contact', 'emergency_contact_phone', 'avatar_url',
        ]
        read_only_fields = ['id', 'username', 'avatar_url']

    def get_avatar_url(self, obj):
        return get_avatar_url(obj, self.context.get('request'))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        profile = getattr(instance, 'account_profile', None)
        data['emergency_contact'] = profile.emergency_contact if profile else ''
        data['emergency_contact_phone'] = profile.emergency_contact_phone if profile else ''
        return data

    def update(self, instance, validated_data):
        emergency_contact = validated_data.pop('emergency_contact', None)
        emergency_contact_phone = validated_data.pop('emergency_contact_phone', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if emergency_contact is not None or emergency_contact_phone is not None:
            profile, _ = AccountProfile.objects.get_or_create(user=instance)
            if emergency_contact is not None:
                profile.emergency_contact = emergency_contact
            if emergency_contact_phone is not None:
                profile.emergency_contact_phone = emergency_contact_phone
            profile.save()

        return instance

