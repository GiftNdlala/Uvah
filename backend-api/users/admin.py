from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, UserProfile, EmergencyContact

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Admin interface for custom User model
    """
    list_display = [
        'phone_number', 'first_name', 'last_name', 'is_verified', 
        'location_consent', 'data_lite_mode', 'is_active', 'created_at'
    ]
    list_filter = [
        'is_verified', 'location_consent', 'data_lite_mode', 
        'is_active', 'created_at', 'updated_at'
    ]
    search_fields = ['phone_number', 'first_name', 'last_name', 'email']
    ordering = ['-created_at']
    
    # Customize fieldsets
    fieldsets = (
        (None, {
            'fields': ('phone_number', 'password')
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'email', 'date_of_birth', 'profile_picture')
        }),
        ('Safety & Privacy', {
            'fields': ('location_consent', 'data_lite_mode', 'share_location_with_friends')
        }),
        ('Verification', {
            'fields': ('is_verified', 'verification_code', 'verification_code_expires')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important dates', {
            'fields': ('last_login', 'created_at', 'updated_at')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone_number', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at', 'verification_code', 'verification_code_expires']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('profile')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    Admin interface for UserProfile model
    """
    list_display = [
        'user', 'home_address_short', 'work_address_short', 
        'preferred_radius', 'auto_checkin_enabled', 'created_at'
    ]
    list_filter = [
        'auto_checkin_enabled', 'sos_escalation_enabled', 
        'push_notifications', 'sms_notifications', 'email_notifications',
        'created_at', 'updated_at'
    ]
    search_fields = ['user__phone_number', 'user__first_name', 'user__last_name']
    ordering = ['-created_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Location Preferences', {
            'fields': ('home_address', 'work_address', 'preferred_radius')
        }),
        ('Safety Preferences', {
            'fields': ('auto_checkin_enabled', 'checkin_reminder_hours', 'sos_escalation_enabled')
        }),
        ('Notification Preferences', {
            'fields': ('push_notifications', 'sms_notifications', 'email_notifications')
        }),
        ('Privacy Settings', {
            'fields': ('location_history_retention_days', 'share_analytics')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
    
    def home_address_short(self, obj):
        """Short version of home address for list display"""
        if obj.home_address:
            return obj.home_address[:50] + '...' if len(obj.home_address) > 50 else obj.home_address
        return '-'
    home_address_short.short_description = 'Home Address'
    
    def work_address_short(self, obj):
        """Short version of work address for list display"""
        if obj.work_address:
            return obj.work_address[:50] + '...' if len(obj.work_address) > 50 else obj.work_address
        return '-'
    work_address_short.short_description = 'Work Address'

@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    """
    Admin interface for EmergencyContact model
    """
    list_display = [
        'user', 'name', 'phone_number', 'relationship', 
        'is_primary', 'can_see_location', 'notification_preference'
    ]
    list_filter = [
        'relationship', 'is_primary', 'can_see_location', 
        'notification_preference', 'created_at'
    ]
    search_fields = [
        'user__phone_number', 'user__first_name', 'user__last_name',
        'name', 'phone_number'
    ]
    ordering = ['user', '-is_primary', 'created_at']
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('user', 'name', 'phone_number', 'relationship')
        }),
        ('Permissions', {
            'fields': ('is_primary', 'can_see_location')
        }),
        ('Notifications', {
            'fields': ('notification_preference',)
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
    
    readonly_fields = ['created_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

# Customize admin site
admin.site.site_header = "Uvah? Admin"
admin.site.site_title = "Uvah? Admin Portal"
admin.site.index_title = "Welcome to Uvah? Administration"
