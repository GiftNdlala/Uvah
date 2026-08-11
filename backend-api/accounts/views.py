from rest_framework import status, permissions, generics
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from PIL import Image, UnidentifiedImageError

from .models import AccountProfile
from .serializers import RegistrationSerializer, LoginSerializer, UserSerializer, ProfileSerializer
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


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]

    def get_object(self):
        return self.request.user

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx


class AvatarUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [SimpleJWTAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        avatar_file = request.FILES.get('avatar')
        if not avatar_file:
            return Response({'detail': 'avatar file is required'}, status=status.HTTP_400_BAD_REQUEST)

        content_type = getattr(avatar_file, 'content_type', '') or ''
        if content_type and not content_type.startswith('image/'):
            return Response({'detail': 'File must be an image'}, status=status.HTTP_400_BAD_REQUEST)

        if avatar_file.size > 5 * 1024 * 1024:
            return Response({'detail': 'Image must be under 5MB'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with Image.open(avatar_file) as image:
                image.verify()
            avatar_file.seek(0)
        except (UnidentifiedImageError, OSError):
            return Response({'detail': 'File must be a valid image'}, status=status.HTTP_400_BAD_REQUEST)

        profile, _ = AccountProfile.objects.get_or_create(user=request.user)
        profile.avatar = avatar_file
        profile.save()

        serializer = ProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

