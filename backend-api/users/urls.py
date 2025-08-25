from django.urls import path
from . import views

app_name = 'users'

urlpatterns = [
    # Authentication endpoints
    path('auth/send-otp/', views.SendOTPView.as_view(), name='send-otp'),
    path('auth/verify-otp/', views.VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/register/', views.UserRegistrationView.as_view(), name='register'),
    path('auth/login/', views.UserLoginView.as_view(), name='login'),
    path('auth/refresh/', views.TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', views.logout_view, name='logout'),
    
    # User profile endpoints
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/settings/', views.UserProfileUpdateView.as_view(), name='profile-settings'),
    path('profile/change-password/', views.PasswordChangeView.as_view(), name='change-password'),
    path('status/', views.user_status_view, name='user-status'),
    
    # Emergency contacts endpoints
    path('emergency-contacts/', views.EmergencyContactListView.as_view(), name='emergency-contacts'),
    path('emergency-contacts/<int:pk>/', views.EmergencyContactDetailView.as_view(), name='emergency-contact-detail'),
]
