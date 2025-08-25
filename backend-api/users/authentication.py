from rest_framework import authentication
from rest_framework import exceptions
from django.contrib.auth import get_user_model
from django.conf import settings
import jwt
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class PhoneNumberJWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT authentication using phone numbers
    """
    
    def authenticate(self, request):
        # Get the token from the Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header:
            return None
        
        # Check if it's a Bearer token
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode the JWT token
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=['HS256']
            )
            
            # Check if token has expired
            exp = payload.get('exp')
            if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
                raise exceptions.AuthenticationFailed('Token has expired')
            
            # Get user by phone number
            phone_number = payload.get('phone_number')
            if not phone_number:
                raise exceptions.AuthenticationFailed('Invalid token payload')
            
            try:
                user = User.objects.get(phone_number=phone_number)
                if not user.is_active:
                    raise exceptions.AuthenticationFailed('User account is disabled')
                
                return (user, token)
                
            except User.DoesNotExist:
                raise exceptions.AuthenticationFailed('User not found')
                
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise exceptions.AuthenticationFailed('Authentication failed')

class JWTAuthenticationService:
    """
    Service for creating and managing JWT tokens
    """
    
    @staticmethod
    def create_access_token(user: User, expires_in_hours: int = 24) -> str:
        """
        Create a JWT access token for a user
        """
        payload = {
            'user_id': user.id,
            'phone_number': user.phone_number,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_verified': user.is_verified,
            'exp': datetime.utcnow() + timedelta(hours=expires_in_hours),
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    
    @staticmethod
    def create_refresh_token(user: User, expires_in_days: int = 30) -> str:
        """
        Create a JWT refresh token for a user
        """
        payload = {
            'user_id': user.id,
            'phone_number': user.phone_number,
            'exp': datetime.utcnow() + timedelta(days=expires_in_days),
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    
    @staticmethod
    def decode_token(token: str) -> dict:
        """
        Decode a JWT token and return payload
        """
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.InvalidTokenError as e:
            raise exceptions.AuthenticationFailed(f'Invalid token: {str(e)}')
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> str:
        """
        Refresh an access token using a refresh token
        """
        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
            
            # Check if it's a refresh token
            if payload.get('type') != 'refresh':
                raise exceptions.AuthenticationFailed('Invalid token type')
            
            # Check if token has expired
            exp = payload.get('exp')
            if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
                raise exceptions.AuthenticationFailed('Refresh token has expired')
            
            # Get user
            user_id = payload.get('user_id')
            try:
                user = User.objects.get(id=user_id)
                return JWTAuthenticationService.create_access_token(user)
            except User.DoesNotExist:
                raise exceptions.AuthenticationFailed('User not found')
                
        except jwt.InvalidTokenError as e:
            raise exceptions.AuthenticationFailed(f'Invalid refresh token: {str(e)}')

class PhoneNumberBackend:
    """
    Custom authentication backend for phone number authentication
    """
    
    def authenticate(self, request, phone_number=None, password=None):
        if phone_number is None or password is None:
            return None
        
        try:
            user = User.objects.get(phone_number=phone_number)
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None
        
        return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
