from django.urls import path
from .views import (
    UserSearchView,
    SendFriendRequestView,
    IncomingRequestsView,
    RespondFriendRequestView,
    FriendsListView,
    ToggleLiveShareView,
    UpdateMyLocationView,
    FriendsLocationsView,
    NotificationListView,
    MarkNotificationReadView,
)


urlpatterns = [
    path('users/search/', UserSearchView.as_view(), name='user-search'),
    path('friends/requests/send/', SendFriendRequestView.as_view(), name='friend-send'),
    path('friends/requests/incoming/', IncomingRequestsView.as_view(), name='friend-incoming'),
    path('friends/requests/<int:request_id>/respond/', RespondFriendRequestView.as_view(), name='friend-respond'),
    path('friends/', FriendsListView.as_view(), name='friends-list'),
    path('live-share/toggle/', ToggleLiveShareView.as_view(), name='live-share-toggle'),
    path('location/update/', UpdateMyLocationView.as_view(), name='location-update'),
    path('location/friends/', FriendsLocationsView.as_view(), name='friends-locations'),
    path('notifications/', NotificationListView.as_view(), name='notifications-list'),
    path('notifications/<int:notification_id>/read/', MarkNotificationReadView.as_view(), name='notification-mark-read'),
]

