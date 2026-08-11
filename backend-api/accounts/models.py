from django.conf import settings
from django.db import models


class AccountProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='account_profile')
    avatar = models.ImageField(upload_to='avatars/%Y/%m/', blank=True, null=True)
    emergency_contact = models.CharField(max_length=120, blank=True, default='')
    emergency_contact_phone = models.CharField(max_length=32, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AccountProfile<{self.user_id}>"
