# Backend Plan

Status snapshot date: 2026-05-12

## Phase 1: Lock the Contract (Day 1) - DONE
1. Freeze one backend architecture:
- Keep `accounts + social + alerts` as canonical.
- Defer `users` module (don’t mix both systems now).

2. Write the API contract first (single markdown file):
- `POST /api/accounts/auth/register/`
- `POST /api/accounts/auth/login/`
- `POST /api/accounts/auth/refresh/`
- `GET /api/accounts/profile/me/`
- `PATCH /api/accounts/profile/me/`
- `POST /api/alerts`
- `GET /api/alerts/my-alerts/`
- `POST /api/alerts/{id}/cancel/`
- `POST /api/alerts/{id}/locations`
- `GET /api/alerts/{id}`
- social endpoints already present

3. Normalize alert statuses:
- Use `active | canceled | resolved` everywhere (frontend + backend).

Notes:
- Confirmed complete based on existing routes, contract doc, and model status vocabulary.

---

## Phase 2: Alerts Completion (Days 2-3) - DONE
1. Add alert owner field:
- `Alert.user = ForeignKey(settings.AUTH_USER_MODEL, ...)`
- migration + backfill strategy for existing rows.

2. Add permissions:
- Only alert owner can post locations/cancel/view detail.
- `my-alerts` returns only current user’s alerts.

3. Implement missing endpoints:
- `GET /api/alerts/my-alerts/`
- `POST /api/alerts/{id}/cancel/` with idempotent behavior.

4. Update serializer output:
- Include latest location in list/detail payloads if needed by UI.

Notes:
- Confirmed complete.
- Legacy handling decision (approved): orphan alerts are auto-marked `resolved` via data migration `backend-api/alerts/migrations/0003_backfill_orphan_alerts_resolved.py`.
- `Alert.user` remains nullable by design for legacy compatibility.

---

## Phase 3: Real Profile Persistence (Day 4) - DONE
1. Extend account serializer for editable fields:
- `first_name`, `last_name`, `email`,
- `emergency_contact`, `emergency_contact_phone` (or normalized table).

2. Implement:
- `GET /api/accounts/profile/me/`
- `PATCH /api/accounts/profile/me/`

3. Wire mobile screens:
- Replace local placeholders in profile/edit screens with API reads/writes.

Notes:
- Confirmed complete in backend and mobile profile flows.

---

## Phase 4: Mobile Auth Hardening (Day 5)
1. Add auto-refresh logic in `apiFetch`:
- On `401`, call refresh endpoint once, store new access token, retry original request.

2. Add clean logout flow:
- Clear tokens + reset nav.
- Optional server logout endpoint later.

3. Move `BASE_URL` to env config (dev/staging/prod).

---

## Phase 5: Social Flow Finalization (Day 6)
1. Remove demo fallbacks in contacts/friend detail/map.
2. Ensure request lifecycle works end-to-end:
- send invite -> incoming list -> accept/reject -> friend list updates.
3. Confirm live-share toggle permission behavior and error messages.

---

## Phase 6: Security + Settings (Day 7)
1. Fix settings bug:
- `SECURE_HSTS_PRELOAD = Tru` -> `True`.
2. Tighten prod config:
- explicit `ALLOWED_HOSTS`
- strict CORS origins
- secure cookies/headers when applicable.
3. Add request logging + structured error responses.

**Implementation notes (Phase 6 – Security & Settings)**
- Edit `backend-api/backend_api/settings.py`:
  - Set a real `ALLOWED_HOSTS = ['yourdomain.com']`.
  - Define `CORS_ALLOWED_ORIGINS = ['https://yourdomain.com']` (or the exact mobile‑app origin).
  - Enable secure cookies and HTTPS:
    - `SESSION_COOKIE_SECURE = True`
    - `CSRF_COOKIE_SECURE = True`
    - `SECURE_SSL_REDIRECT = True`
    - `SECURE_HSTS_PRELOAD = True` (already fixed).
- Install a JSON logger (e.g., `django-json-logger` or `structlog`) and configure Django `LOGGING` to emit structured logs.
- Add a custom DRF exception handler returning `{"error": "...", "code": <status>}` payloads.


---

## Phase 7: Notifications/Comms (Days 8-9)
1. Implement one real delivery channel for SOS (SMS or WhatsApp API).
2. Trigger on alert create for active SOS severity.
3. Add delivery status tracking per alert.

---

## Phase 8: Tests + Finish Line (Days 10-11)
1. Backend tests:
- auth register/login/refresh/profile
- alerts create/list/cancel/location permissions
- social invite/respond/share/location visibility

2. Frontend smoke tests manual checklist:
- login/register
- check-in + SOS + cancel
- friends invite/respond
- profile save/readback

3. Done criteria:
- no demo data paths
- no “wired next” alerts in UI
- all critical API tests passing
- app usable end-to-end on real device.

