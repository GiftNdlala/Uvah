# Uvah Mobile API Contract (Phase 1)

This contract reflects the active backend architecture: `accounts + alerts + social`.

## Base
- Prefix: `/api`
- Auth: `Authorization: Bearer <access_token>`
- Content type: `application/json`

## Accounts

### `POST /api/accounts/auth/register/`
Request:
```json
{
  "username": "gift_ndlala",
  "password": "strongpassword"
}
```
Response `201`:
```json
{
  "success": true,
  "tokens": { "access": "jwt", "refresh": "jwt" },
  "user": {
    "id": 1,
    "username": "gift_ndlala",
    "first_name": "",
    "last_name": "",
    "email": "",
    "emergency_contact": "",
    "emergency_contact_phone": ""
  }
}
```

### `POST /api/accounts/auth/login/`
Request:
```json
{
  "username": "gift_ndlala",
  "password": "strongpassword"
}
```

### `POST /api/accounts/auth/refresh/`
Request:
```json
{
  "refresh": "jwt"
}
```
Response `200`:
```json
{
  "success": true,
  "access": "jwt"
}
```

### `GET /api/accounts/profile/me/`
Response `200`:
```json
{
  "id": 1,
  "username": "gift_ndlala",
  "first_name": "Gift",
  "last_name": "Ndlala",
  "email": "gift@example.com",
  "emergency_contact": "Lerato Ndlala",
  "emergency_contact_phone": "+27829876543"
}
```

### `PATCH /api/accounts/profile/me/`
Request fields (partial update supported):
```json
{
  "first_name": "Gift",
  "last_name": "Ndlala",
  "email": "gift@example.com",
  "emergency_contact": "Lerato Ndlala",
  "emergency_contact_phone": "+27829876543"
}
```

## Alerts

### Status Vocabulary
- `active`
- `canceled`
- `resolved`

### `POST /api/alerts`
Request:
```json
{
  "severity_level": 2,
  "trigger_count": 2,
  "trigger_source": "app",
  "message": "Emergency SOS activated"
}
```

### `GET /api/alerts/my-alerts/`
Optional query:
- `?status=active`

Response `200`:
```json
[
  {
    "id": 25,
    "severity_level": 2,
    "trigger_count": 2,
    "trigger_source": "app",
    "message": "Emergency SOS activated",
    "status": "active",
    "live_view_token": "token",
    "share_url": "http://host/live/token",
    "latest_location": {
      "lat": -26.2041,
      "lon": 28.0473,
      "accuracy": 20.0,
      "captured_at": "2026-05-07T08:30:00Z"
    },
    "created_at": "2026-05-07T08:20:00Z"
  }
]
```

### `POST /api/alerts/{id}/cancel/`
Idempotent cancel for owner.

### `POST /api/alerts/{id}/locations`
Request:
```json
{
  "lat": -26.2041,
  "lon": 28.0473,
  "accuracy": 20
}
```

### `GET /api/alerts/{id}`
Owner-only alert detail.

### `GET /api/live/{token}/latest`
Public live tracking payload for share links.

## Social

### `GET /api/social/users/search/?q=<query>`
### `POST /api/social/friends/requests/send/`
### `GET /api/social/friends/requests/incoming/`
### `POST /api/social/friends/requests/{request_id}/respond/`
### `GET /api/social/friends/`
### `POST /api/social/live-share/toggle/`
### `POST /api/social/location/update/`
### `GET /api/social/location/friends/`
