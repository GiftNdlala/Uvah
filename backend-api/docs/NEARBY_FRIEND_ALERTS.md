# Nearby Friend Alerts

## Goal

Notify a user when an accepted friend who is actively sharing their live location comes within a chosen distance. This is an opt-in social convenience feature, not a safety or tracking guarantee.

## Release-one policy

- Default threshold: 1 km.
- Both users must enable nearby-friend alerts.
- Both users must have active live-location sharing enabled.
- Ignore locations older than 15 minutes or marked stale.
- Trigger only when the friend enters the threshold, not on every subsequent location update.
- Apply a per-user, per-friend cooldown of 6 hours.
- The notification action opens Trusted Circle Map focused on that friend.

## Data model

Store settings per user:

- `nearby_friend_alerts_enabled` (boolean, default `false`)
- `nearby_friend_alert_radius_m` (integer, default `1000`, bounded to 250–5000)

Store delivery state per ordered pair of users:

- recipient user id
- friend user id
- whether that friend is currently inside the recipient's alert radius
- `last_notified_at`

The pair state prevents duplicate notifications and allows a new notification only after the friend leaves and later re-enters the radius.

## Detection flow

1. A user submits a successful location update.
2. On the backend, load their accepted friends who have both opted in and whose latest location is fresh.
3. Compute the distance using the Haversine formula.
4. For each eligible recipient, compare the new distance against that recipient's selected radius and update pair state.
5. Send a push notification only on an outside-to-inside transition where the cooldown has expired.

## Privacy and safety

- Never evaluate or alert for blocked, removed, or unaccepted friendships.
- Do not include exact coordinates in a lock-screen notification.
- Let users disable alerts globally and disable live sharing independently.
- Do not use stale, missing, or low-confidence locations.
- Document that GPS accuracy varies and that notifications are best effort.

## Mobile UX

Settings copy: `Notify me when friends are nearby`.

Notification copy: `John is less than 1 km away. View`.

The View action opens the existing Trusted Circle map and focuses the map on John's latest shared location.

## Later enhancements

- Per-friend mute controls.
- User-selectable radius presets (500 m, 1 km, 2 km).
- Quiet hours.
- A foreground-only mode before supporting Android background location/geofencing.
