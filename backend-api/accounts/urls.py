from django.urls import path
from .views import RegisterView, LoginView, TokenRefreshView, ProfileView


urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profile/me/', ProfileView.as_view(), name='profile'),
]

