from django.db import transaction

from .models import Friendship, Notification


def _deliver_after_commit(notification_ids):
    ids = [notification_id for notification_id in notification_ids if notification_id]
    if not ids:
        return

    def deliver():
        from .push import deliver_notifications
        deliver_notifications(ids)

    transaction.on_commit(deliver)


def notify_user(*, user, notification_type, title, message, related_entity_id=None):
    notification = Notification.objects.create(
        user=user,
        notification_type=notification_type,
        title=title,
        message=message,
        related_entity_id=related_entity_id,
    )
    _deliver_after_commit([notification.id])
    return notification


def _notify_friends(actor, *, notification_type, title, message, related_entity_id):
    friend_ids = list(
        Friendship.objects.filter(user=actor).values_list('friend_id', flat=True)
    )
    notifications = Notification.objects.bulk_create([
        Notification(
            user_id=friend_id,
            notification_type=notification_type,
            title=title,
            message=message,
            related_entity_id=related_entity_id,
        )
        for friend_id in friend_ids
    ])
    _deliver_after_commit([notification.id for notification in notifications])
    return notifications


def notify_friends_sos(actor, alert):
    """Persist an SOS for every friend, then push it after the transaction commits."""
    return _notify_friends(
        actor,
        notification_type='sos_alert',
        title='SOS Alert',
        message=f'@{actor.username} activated an emergency SOS. Tap to view their live location.',
        related_entity_id=alert.id,
    )


def notify_friends_checkin(actor, alert):
    return _notify_friends(
        actor,
        notification_type='checkin',
        title='Friend Check-in',
        message=f'@{actor.username} sent a safety check-in.',
        related_entity_id=alert.id,
    )
