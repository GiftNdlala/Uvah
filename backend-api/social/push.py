import logging
from datetime import timedelta
from functools import lru_cache

from django.db.models import Q
from django.utils import timezone

from .models import Notification, PushDevice


logger = logging.getLogger(__name__)
MAX_PUSH_ATTEMPTS = 8
MAX_MULTICAST_TOKENS = 500


@lru_cache(maxsize=1)
def _firebase_messaging():
    try:
        import firebase_admin
        from firebase_admin import messaging

        try:
            firebase_admin.get_app()
        except ValueError:
            # Application Default Credentials reads GOOGLE_APPLICATION_CREDENTIALS,
            # which points at Render's /etc/secrets service-account JSON.
            firebase_admin.initialize_app()
        return messaging
    except Exception as exc:
        logger.warning('Firebase push is unavailable: %s', exc)
        return None


def _data_payload(notification):
    payload = {
        'notification_id': str(notification.id),
        'notification_type': notification.notification_type,
        'title': notification.title,
        'message': notification.message,
        'created_at': notification.created_at.isoformat(),
    }
    if notification.related_entity_id is not None:
        payload['related_entity_id'] = str(notification.related_entity_id)
    return payload


def _is_invalid_token_error(exc):
    code = str(getattr(exc, 'code', '') or '').lower()
    message = str(exc).lower()
    return any(marker in f'{code} {message}' for marker in (
        'registration-token-not-registered',
        'unregistered',
        'sender-id-mismatch',
        'requested entity was not found',
    ))


def _record_failure(notification, message):
    notification.push_attempts += 1
    delay_minutes = min(60, 2 ** min(notification.push_attempts - 1, 6))
    notification.push_next_attempt_at = timezone.now() + timedelta(minutes=delay_minutes)
    notification.push_last_error = str(message)[:2000]
    notification.save(update_fields=[
        'push_attempts',
        'push_next_attempt_at',
        'push_last_error',
    ])


def deliver_notification(notification_id):
    try:
        notification = Notification.objects.get(pk=notification_id)
    except Notification.DoesNotExist:
        return False

    if notification.push_delivered_at or notification.push_attempts >= MAX_PUSH_ATTEMPTS:
        return bool(notification.push_delivered_at)

    devices = list(PushDevice.objects.filter(
        user_id=notification.user_id,
        is_active=True,
    ).order_by('-last_seen_at')[:MAX_MULTICAST_TOKENS])
    if not devices:
        notification.push_last_error = 'No registered push devices.'
        notification.push_next_attempt_at = timezone.now() + timedelta(hours=6)
        notification.save(update_fields=['push_last_error', 'push_next_attempt_at'])
        return False

    messaging = _firebase_messaging()
    if messaging is None:
        notification.push_last_error = 'Firebase credentials are not configured.'
        notification.push_next_attempt_at = timezone.now() + timedelta(minutes=10)
        notification.save(update_fields=['push_last_error', 'push_next_attempt_at'])
        return False

    is_sos = notification.notification_type == 'sos_alert'
    try:
        message = messaging.MulticastMessage(
            tokens=[device.token for device in devices],
            notification=messaging.Notification(
                title=notification.title,
                body=notification.message,
            ),
            data=_data_payload(notification),
            android=messaging.AndroidConfig(
                priority='high' if is_sos else 'normal',
                ttl=timedelta(hours=1 if is_sos else 12),
                notification=messaging.AndroidNotification(
                    channel_id='uvah-emergency-v1' if is_sos else 'uvah-updates-v1',
                    sound='default',
                    color='#ff3147' if is_sos else '#2aa8f2',
                    tag=f'uvah-{notification.id}',
                ),
            ),
        )
        response = messaging.send_each_for_multicast(message)
    except Exception as exc:
        logger.exception('Firebase send failed for notification %s', notification.id)
        _record_failure(notification, exc)
        return False

    for device, send_response in zip(devices, response.responses):
        if not send_response.success and _is_invalid_token_error(send_response.exception):
            PushDevice.objects.filter(pk=device.pk).update(is_active=False)

    if response.success_count > 0:
        notification.push_attempts += 1
        notification.push_delivered_at = timezone.now()
        notification.push_next_attempt_at = None
        notification.push_last_error = '' if response.failure_count == 0 else f'{response.failure_count} device delivery failure(s).'
        notification.save(update_fields=[
            'push_attempts',
            'push_delivered_at',
            'push_next_attempt_at',
            'push_last_error',
        ])
        return True

    _record_failure(notification, 'Firebase rejected all registered device tokens.')
    return False


def deliver_notifications(notification_ids):
    return sum(1 for notification_id in notification_ids if deliver_notification(notification_id))


def pending_notifications_queryset():
    now = timezone.now()
    return Notification.objects.filter(
        push_delivered_at__isnull=True,
        push_attempts__lt=MAX_PUSH_ATTEMPTS,
    ).filter(
        Q(push_next_attempt_at__isnull=True) | Q(push_next_attempt_at__lte=now),
    ).order_by('created_at')


def deliver_pending_for_user(user_id, limit=25):
    notification_ids = list(
        pending_notifications_queryset()
        .filter(user_id=user_id)
        .values_list('id', flat=True)[:limit]
    )
    return deliver_notifications(notification_ids)
