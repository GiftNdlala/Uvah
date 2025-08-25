from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserDetailSerializer,
    UserProfileUpdateSerializer, EmergencyContactSerializer, OTPSendSerializer,
    OTPVerifySerializer, PasswordChangeSerializer
)
from .models import User, UserProfile, EmergencyContact
from .services import OTPService
from .authentication import JWTAuthenticationService, PhoneNumberJWTAuthentication

User = get_user_model()

class SendOTPView(APIView):
    """
    Send OTP to phone number for verification
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = OTPSendSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.send_otp()
            if result['success']:
                return Response({
                    'success': True,
                    'message': 'OTP sent successfully',
                    'expires_in_minutes': result['expires_in_minutes']
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': result['message']
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    """
    Verify OTP for phone number
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.verify_otp()
            if result['success']:
                return Response({
                    'success': True,
                    'message': 'OTP verified successfully'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': result['message']
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserRegistrationView(APIView):
    """
    User registration with phone number and OTP verification
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens
            access_token = JWTAuthenticationService.create_access_token(user)
            refresh_token = JWTAuthenticationService.create_refresh_token(user)
            
            return Response({
                'success': True,
                'message': 'User registered successfully',
                'tokens': {
                    'access': access_token,
                    'refresh': refresh_token
                },
                'user': UserDetailSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginView(APIView):
    """
    User login with phone number and password
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            tokens = serializer.get_tokens()
            return Response({
                'success': True,
                'message': 'Login successful',
                'tokens': {
                    'access': tokens['access'],
                    'refresh': tokens['refresh']
                },
                'user': tokens['user']
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TokenRefreshView(APIView):
    """
    Refresh access token using refresh token
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'success': False,
                'message': 'Refresh token is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            new_access_token = JWTAuthenticationService.refresh_access_token(refresh_token)
            return Response({
                'success': True,
                'access': new_access_token
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Get and update user profile
    """
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [PhoneNumberJWTAuthentication]
    
    def get_object(self):
        return self.request.user

class UserProfileUpdateView(generics.UpdateAPIView):
    """
    Update user profile settings
    """
    serializer_class = UserProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [PhoneNumberJWTAuthentication]
    
    def get_object(self):
        user = self.request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        return profile

class PasswordChangeView(APIView):
    """
    Change user password
    """
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [PhoneNumberJWTAuthentication]
    
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'success': True,
                'message': 'Password changed successfully'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EmergencyContactListView(generics.ListCreateAPIView):
    """
    List and create emergency contacts
    """
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [PhoneNumberJWTAuthentication]
    
    def get_queryset(self):
        return EmergencyContact.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class EmergencyContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update and delete emergency contact
    """
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [PhoneNumberJWTAuthentication]
    
    def get_queryset(self):
        return EmergencyContact.objects.filter(user=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Logout user (invalidate tokens)
    Note: In a stateless JWT system, tokens are invalidated client-side
    This endpoint can be used for logging purposes
    """
    # TODO: Implement token blacklisting if needed
    return Response({
        'success': True,
        'message': 'Logout successful'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_status_view(request):
    """
    Get user authentication status and basic info
    """
    user = request.user
    return Response({
        'success': True,
        'user': {
            'id': user.id,
            'phone_number': user.phone_number,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_verified': user.is_verified,
            'location_consent': user.location_consent,
            'data_lite_mode': user.data_lite_mode
        }
    }, status=status.HTTP_200_OK)
