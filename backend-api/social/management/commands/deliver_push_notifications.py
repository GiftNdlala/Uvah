import time

from django.core.management.base import BaseCommand
from django.db import close_old_connections

from social.push import deliver_notifications, pending_notifications_queryset


class Command(BaseCommand):
    help = 'Deliver and retry pending Firebase push notifications.'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=200)
        parser.add_argument('--loop', action='store_true')
        parser.add_argument('--interval', type=int, default=15)

    def handle(self, *args, **options):
        limit = max(1, min(options['limit'], 1000))
        interval = max(5, options['interval'])

        while True:
            close_old_connections()
            notification_ids = list(
                pending_notifications_queryset().values_list('id', flat=True)[:limit]
            )
            delivered = deliver_notifications(notification_ids)
            if notification_ids:
                self.stdout.write(
                    f'Processed {len(notification_ids)} pending notification(s); {delivered} delivered.'
                )

            if not options['loop']:
                break
            time.sleep(interval)
