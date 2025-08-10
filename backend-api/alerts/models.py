import secrets
from django.db import models

class Alert(models.Model):
    STATUS_ACTIVE = 'active'
    STATUS_CANCELED = 'canceled'
    STATUS_RESOLVED = 'resolved'
    STATUS_CHOICES = [
        (STATUS_ACTIVE, 'Active'),
        (STATUS_CANCELED, 'Canceled'),
        (STATUS_RESOLVED, 'Resolved'),
    ]

    severity_level = models.PositiveSmallIntegerField(default=1)
    trigger_count = models.PositiveSmallIntegerField(default=1)
    trigger_source = models.CharField(max_length=32, default='unknown')
    message = models.TextField(blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    live_view_token = models.CharField(max_length=64, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.live_view_token:
            self.live_view_token = secrets.token_urlsafe(16)
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"Alert #{self.pk} ({self.status})"

class AlertLocation(models.Model):
    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, related_name='locations')
    lat = models.FloatField()
    lon = models.FloatField()
    accuracy = models.FloatField(null=True, blank=True)
    captured_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['captured_at']

    def __str__(self):
        return f"Alert {self.alert_id} @ {self.lat},{self.lon}"