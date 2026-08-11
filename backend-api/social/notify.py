from .models import Friendship, Notification


def notify_user(*, user, notification_type, title, message, related_entity_id=None):
    return Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        related_entity_id=related_entity_id,
    )


def notify_friends_sos(actor, alert):
    """Notify all friends when a user triggers SOS."""
    friend_ids = Friendship.objects.filter(user=actor).values_list('friend_id', flat=True)
    from django.contrib.auth import get_user_model

    User = get_user_model()
    for friend in User.objects.filter(id__in=friend_ids):
        notify_user(
            user=friend,
            notification_type='sos_alert',
            title='SOS Alert',
            message=f'@{actor.username} activated an emergency SOS. Open Alerts to view.',
            related_entity_id=alert.id,
        )


def notify_friends_checkin(actor, alert):
    friend_ids = Friendship.objects.filter(user=actor).values_list('friend_id', flat=True)
    from django.contrib.auth import get_user_model

    User = get_user_model()
    for friend in User.objects.filter(id__in=friend_ids):
        notify_user(
            user=friend,
            notification_type='checkin',
            title='Friend Check-in',
            message=f'@{actor.username} sent a safety check-in.',
            related_entity_id=alert.id,
        )
