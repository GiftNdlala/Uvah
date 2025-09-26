from rest_framework import authentication, exceptions
from django.contrib.auth import get_user_model
from django.conf import settings
from datetime import datetime, timedelta
import jwt
import logging


logger = logging.getLogger(__name__)
User = get_user_model()


class SimpleJWTAuthentication(authentication.BaseAuthentication):
    """
    Minimal JWT auth for default Django user model.
    Expects Authorization: Bearer <token> with payload containing user_id and exp.
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            exp = payload.get('exp')
            if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
                raise exceptions.AuthenticationFailed('Token has expired')

            user_id = payload.get('user_id')
            if not user_id:
                raise exceptions.AuthenticationFailed('Invalid token payload')

            try:
                user = User.objects.get(id=user_id)
                if not user.is_active:
                    raise exceptions.AuthenticationFailed('User account is disabled')
                return (user, token)
            except User.DoesNotExist:
                raise exceptions.AuthenticationFailed('User not found')
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except Exception as exc:
            logger.error(f"JWT auth error: {exc}")
            raise exceptions.AuthenticationFailed('Authentication failed')


class JWTService:
    @staticmethod
    def create_access_token(user, expires_in_hours: int = 24) -> str:
        payload = {
            'user_id': user.id,
            'username': user.username,
            'exp': datetime.utcnow() + timedelta(hours=expires_in_hours),
            'iat': datetime.utcnow(),
            'type': 'access',
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    @staticmethod
    def create_refresh_token(user, expires_in_days: int = 30) -> str:
        payload = {
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=expires_in_days),
            'iat': datetime.utcnow(),
            'type': 'refresh',
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    @staticmethod
    def refresh_access_token(refresh_token: str) -> str:
        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=['HS256'])
            if payload.get('type') != 'refresh':
                raise exceptions.AuthenticationFailed('Invalid token type')
            exp = payload.get('exp')
            if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
                raise exceptions.AuthenticationFailed('Refresh token has expired')
            user_id = payload.get('user_id')
            user = User.objects.get(id=user_id)
            return JWTService.create_access_token(user)
        except jwt.InvalidTokenError:
            raise exceptions.AuthenticationFailed('Invalid refresh token')

