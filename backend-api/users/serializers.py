from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile, EmergencyContact
from .services import OTPService, PhoneVerificationService
from .authentication import JWTAuthenticationService

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    otp = serializers.CharField(write_only=True, max_length=6)
    
    class Meta:
        model = User
        fields = [
            'phone_number', 'first_name', 'last_name', 'password', 
            'password_confirm', 'otp', 'date_of_birth'
        ]
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if not PhoneVerificationService.verify_phone_number(value):
            raise serializers.ValidationError("Invalid phone number format")
        
        # Format phone number
        formatted_number = PhoneVerificationService.format_phone_number(value)
        
        # Check if user already exists
        if User.objects.filter(phone_number=formatted_number).exists():
            raise serializers.ValidationError("User with this phone number already exists")
        
        return formatted_number
    
    def validate(self, attrs):
        """Validate password confirmation and OTP"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        
        # Verify OTP
        phone_number = attrs['phone_number']
        otp = attrs['otp']
        
        otp_result = OTPService.verify_otp(phone_number, otp)
        if not otp_result['success']:
            raise serializers.ValidationError(otp_result['message'])
        
        return attrs
    
    def create(self, validated_data):
        """Create new user"""
        # Remove fields not needed for user creation
        validated_data.pop('password_confirm')
        validated_data.pop('otp')
        
        # Create user
        user = User.objects.create_user(
            phone_number=validated_data['phone_number'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            password=validated_data['password'],
            date_of_birth=validated_data.get('date_of_birth'),
            is_verified=True  # OTP verification passed
        )
        
        # Create user profile
        UserProfile.objects.create(user=user)
        
        return user

class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login
    """
    phone_number = serializers.CharField(max_length=17)
    password = serializers.CharField(max_length=128, write_only=True)
    
    def validate(self, attrs):
        """Validate credentials and return user"""
        phone_number = attrs['phone_number']
        password = attrs['password']
        
        # Format phone number
        formatted_number = PhoneVerificationService.format_phone_number(phone_number)
        
        # Authenticate user
        user = authenticate(
            request=self.context.get('request'),
            phone_number=formatted_number,
            password=password
        )
        
        if not user:
            raise serializers.ValidationError("Invalid phone number or password")
        
        if not user.is_active:
            raise serializers.ValidationError("User account is disabled")
        
        attrs['user'] = user
        return attrs
    
    def get_tokens(self):
        """Get access and refresh tokens"""
        user = self.validated_data['user']
        return {
            'access': JWTAuthenticationService.create_access_token(user),
            'refresh': JWTAuthenticationService.create_refresh_token(user),
            'user': UserDetailSerializer(user).data
        }

class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for user details
    """
    profile = serializers.SerializerMethodField()
    emergency_contacts = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'phone_number', 'first_name', 'last_name', 'email',
            'profile_picture', 'date_of_birth', 'is_verified',
            'location_consent', 'data_lite_mode', 'share_location_with_friends',
            'created_at', 'updated_at', 'profile', 'emergency_contacts'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_profile(self, obj):
        """Get user profile data"""
        try:
            profile = obj.profile
            return {
                'home_address': profile.home_address,
                'work_address': profile.work_address,
                'preferred_radius': profile.preferred_radius,
                'auto_checkin_enabled': profile.auto_checkin_enabled,
                'checkin_reminder_hours': profile.checkin_reminder_hours,
                'sos_escalation_enabled': profile.sos_escalation_enabled,
                'push_notifications': profile.push_notifications,
                'sms_notifications': profile.sms_notifications,
                'email_notifications': profile.email_notifications,
                'location_history_retention_days': profile.location_history_retention_days,
                'share_analytics': profile.share_analytics,
            }
        except UserProfile.DoesNotExist:
            return None
    
    def get_emergency_contacts(self, obj):
        """Get user's emergency contacts"""
        contacts = obj.emergency_contacts_list.all()
        return EmergencyContactSerializer(contacts, many=True).data

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile
    """
    class Meta:
        model = UserProfile
        fields = [
            'home_address', 'work_address', 'preferred_radius',
            'auto_checkin_enabled', 'checkin_reminder_hours', 'sos_escalation_enabled',
            'push_notifications', 'sms_notifications', 'email_notifications',
            'location_history_retention_days', 'share_analytics'
        ]
    
    def update(self, instance, validated_data):
        """Update user profile"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class EmergencyContactSerializer(serializers.ModelSerializer):
    """
    Serializer for emergency contacts
    """
    class Meta:
        model = EmergencyContact
        fields = [
            'id', 'name', 'phone_number', 'relationship', 'is_primary',
            'can_see_location', 'notification_preference', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if not PhoneVerificationService.verify_phone_number(value):
            raise serializers.ValidationError("Invalid phone number format")
        return PhoneVerificationService.format_phone_number(value)

class OTPSendSerializer(serializers.Serializer):
    """
    Serializer for sending OTP
    """
    phone_number = serializers.CharField(max_length=17)
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if not PhoneVerificationService.verify_phone_number(value):
            raise serializers.ValidationError("Invalid phone number format")
        return PhoneVerificationService.format_phone_number(value)
    
    def send_otp(self):
        """Send OTP to phone number"""
        phone_number = self.validated_data['phone_number']
        return OTPService.send_otp(phone_number)

class OTPVerifySerializer(serializers.Serializer):
    """
    Serializer for verifying OTP
    """
    phone_number = serializers.CharField(max_length=17)
    otp = serializers.CharField(max_length=6)
    
    def validate_phone_number(self, value):
        """Validate phone number format"""
        if not PhoneVerificationService.verify_phone_number(value):
            raise serializers.ValidationError("Invalid phone number format")
        return PhoneVerificationService.format_phone_number(value)
    
    def verify_otp(self):
        """Verify OTP"""
        phone_number = self.validated_data['phone_number']
        otp = self.validated_data['otp']
        return OTPService.verify_otp(phone_number, otp)

class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for changing password
    """
    old_password = serializers.CharField(max_length=128)
    new_password = serializers.CharField(max_length=128, validators=[validate_password])
    new_password_confirm = serializers.CharField(max_length=128)
    
    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match")
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Invalid old password")
        return value
