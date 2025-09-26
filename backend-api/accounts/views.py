from rest_framework import status, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model

from .serializers import RegistrationSerializer, LoginSerializer, UserSerializer
from .authentication import JWTService, SimpleJWTAuthentication


User = get_user_model()


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        access = JWTService.create_access_token(user)
        refresh = JWTService.create_refresh_token(user)
        return Response({
            'success': True,
            'tokens': {'access': access, 'refresh': refresh},
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        access = JWTService.create_access_token(user)
        refresh = JWTService.create_refresh_token(user)
        return Response({
            'success': True,
            'tokens': {'access': access, 'refresh': refresh},
            'user': UserSerializer(user).data,
        })


class TokenRefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'success': False, 'message': 'Refresh token is required'}, status=400)
        new_access = JWTService.refresh_access_token(refresh)
        return Response({'success': True, 'access': new_access})


class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_object(self):
        return self.request.user

