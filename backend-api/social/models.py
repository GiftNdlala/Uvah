from django.db import models
from django.conf import settings


class Friendship(models.Model):
    """
    Mutual friendship by confirmation. Pending requests tracked separately.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='friends')
    friend = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='friend_of')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'friend')


class FriendRequest(models.Model):
    from_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_requests')
    to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=16, default='pending')  # pending, accepted, rejected, canceled

    class Meta:
        unique_together = ('from_user', 'to_user')


class LiveShare(models.Model):
    """
    In-app location sharing consent from owner to viewer.
    """
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='live_shares_out')
    viewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='live_shares_in')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('owner', 'viewer')


class UserLocation(models.Model):
    """
    Latest known location per user for in-app sharing.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='last_location')
    lat = models.FloatField()
    lon = models.FloatField()
    accuracy = models.FloatField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=32) # 'friend_request', 'friend_accept', 'system', etc.
    title = models.CharField(max_length=128)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_entity_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    push_attempts = models.PositiveSmallIntegerField(default=0)
    push_delivered_at = models.DateTimeField(null=True, blank=True)
    push_next_attempt_at = models.DateTimeField(null=True, blank=True)
    push_last_error = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.title}"


class PushDevice(models.Model):
    PLATFORM_ANDROID = 'android'
    PLATFORM_IOS = 'ios'
    PLATFORM_CHOICES = [
        (PLATFORM_ANDROID, 'Android'),
        (PLATFORM_IOS, 'iOS'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_devices')
    token = models.CharField(max_length=512, unique=True)
    device_id = models.CharField(max_length=128)
    platform = models.CharField(max_length=16, choices=PLATFORM_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'is_active'], name='social_push_user_active_idx'),
        ]

    def __str__(self):
        return f"PushDevice<{self.user_id}:{self.platform}:{self.device_id}>"
