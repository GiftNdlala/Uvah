from types import SimpleNamespace

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Friendship, Notification, PushDevice
from .notify import notify_friends_sos


User = get_user_model()


class NotificationReliabilityTests(TestCase):
    def setUp(self):
        self.actor = User.objects.create_user(username='actor', password='test-pass-123')
        self.friend = User.objects.create_user(username='friend', password='test-pass-123')
        Friendship.objects.create(user=self.actor, friend=self.friend)

    def test_sos_is_persisted_for_each_friend_before_push(self):
        with self.captureOnCommitCallbacks(execute=False) as callbacks:
            notifications = notify_friends_sos(self.actor, SimpleNamespace(id=42))

        self.assertEqual(len(notifications), 1)
        saved = Notification.objects.get(user=self.friend)
        self.assertEqual(saved.notification_type, 'sos_alert')
        self.assertEqual(saved.related_entity_id, 42)
        self.assertEqual(len(callbacks), 1)

    def test_device_registration_rotates_old_token_for_same_device(self):
        client = APIClient()
        client.force_authenticate(self.friend)

        first = client.post('/api/social/push-tokens/register/', {
            'token': 'token-one',
            'device_id': 'phone-1',
            'platform': 'android',
        }, format='json')
        second = client.post('/api/social/push-tokens/register/', {
            'token': 'token-two',
            'device_id': 'phone-1',
            'platform': 'android',
        }, format='json')

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertFalse(PushDevice.objects.get(token='token-one').is_active)
        self.assertTrue(PushDevice.objects.get(token='token-two').is_active)

    def test_user_can_only_unregister_their_own_token(self):
        PushDevice.objects.create(
            user=self.friend,
            token='private-token',
            device_id='phone-2',
            platform='android',
        )
        client = APIClient()
        client.force_authenticate(self.actor)
        response = client.post('/api/social/push-tokens/unregister/', {
            'token': 'private-token',
        }, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(PushDevice.objects.get(token='private-token').is_active)
