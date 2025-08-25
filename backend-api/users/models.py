from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
import uuid

class User(AbstractUser):
    """
    Custom User model for Uvah? app with phone number authentication
    """
    # Remove username field since we'll use phone number
    username = None
    
    # Phone number field with validation
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=17, 
        unique=True,
        help_text="Phone number in international format (e.g., +27123456789)"
    )
    
    # Profile fields
    profile_picture = models.URLField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    emergency_contacts = models.JSONField(default=list, blank=True)
    
    # Safety and privacy settings
    location_consent = models.BooleanField(default=False)
    data_lite_mode = models.BooleanField(default=True, help_text="Reduce GPS update frequency to save data")
    share_location_with_friends = models.BooleanField(default=False)
    
    # Verification and security
    is_verified = models.BooleanField(default=False)
    verification_code = models.CharField(max_length=6, blank=True, null=True)
    verification_code_expires = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use phone number as the unique identifier
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.phone_number})"
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        return self.first_name
    
    @property
    def is_emergency_contact_set(self):
        """Check if user has set emergency contacts"""
        return len(self.emergency_contacts) > 0

class UserProfile(models.Model):
    """
    Extended user profile information
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Location preferences
    home_address = models.TextField(blank=True)
    work_address = models.TextField(blank=True)
    preferred_radius = models.PositiveIntegerField(default=1000, help_text="Preferred radius in meters for location sharing")
    
    # Safety preferences
    auto_checkin_enabled = models.BooleanField(default=False)
    checkin_reminder_hours = models.PositiveIntegerField(default=24)
    sos_escalation_enabled = models.BooleanField(default=True)
    
    # Notification preferences
    push_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=True)
    email_notifications = models.BooleanField(default=False)
    
    # Privacy settings
    location_history_retention_days = models.PositiveIntegerField(default=7)
    share_analytics = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
    
    def __str__(self):
        return f"Profile for {self.user.get_full_name()}"

class EmergencyContact(models.Model):
    """
    Emergency contacts for users
    """
    RELATIONSHIP_CHOICES = [
        ('family', 'Family'),
        ('friend', 'Friend'),
        ('colleague', 'Colleague'),
        ('neighbor', 'Neighbor'),
        ('other', 'Other'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_contacts_list')
    name = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=17)
    relationship = models.CharField(max_length=20, choices=RELATIONSHIP_CHOICES)
    is_primary = models.BooleanField(default=False)
    can_see_location = models.BooleanField(default=False)
    notification_preference = models.CharField(
        max_length=10, 
        choices=[('sms', 'SMS'), ('call', 'Call'), ('both', 'Both')],
        default='both'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'emergency_contacts'
        unique_together = ['user', 'phone_number']
    
    def __str__(self):
        return f"{self.name} ({self.relationship}) - {self.user.get_full_name()}"
    
    def save(self, *args, **kwargs):
        # Ensure only one primary contact per user
        if self.is_primary:
            EmergencyContact.objects.filter(user=self.user, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)
