import time

from django.db import OperationalError, transaction

from .models import UserLocation


def upsert_user_location(user, lat, lon, accuracy=None, max_retries=4):
    """Save latest user location with retries (helps SQLite under concurrent mobile polls)."""
    defaults = {'lat': float(lat), 'lon': float(lon)}
    if accuracy is not None:
        defaults['accuracy'] = float(accuracy)

    last_error = None
    for attempt in range(max_retries):
        try:
            with transaction.atomic():
                loc, _ = UserLocation.objects.update_or_create(
                    user=user,
                    defaults=defaults,
                )
            return loc
        except OperationalError as exc:
            last_error = exc
            if 'locked' not in str(exc).lower():
                raise
            time.sleep(0.05 * (2 ** attempt))

    raise last_error
