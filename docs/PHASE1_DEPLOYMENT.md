# UVAH Phase 1 deployment handoff

Status: deployed backend and Android internal-test build.

## Production architecture

| Component | Phase 1 choice |
| --- | --- |
| Mobile app | React Native Android app in `mobile-app/` |
| Backend | Django API in `backend-api/` |
| Public API | `https://uvah.onrender.com` |
| Hosting | Render Web Service, Docker deployment |
| Production database | Supabase PostgreSQL through its Session Pooler connection string |
| Development database | SQLite when `DATABASE_URL` is not set |
| Authentication | Username/password with access and refresh JWTs |
| Maps | Google Maps Android SDK and `react-native-maps` |

The mobile production URL is defined once in `mobile-app/src/config/env.js` as `ENV.BASE_URL`. Do not put a local IP address in a release APK.

## Render backend configuration

Render is configured as a Docker Web Service with:

- Repository root directory: `backend-api`
- Dockerfile: `backend-api/Dockerfile`
- Public URL: `https://uvah.onrender.com`
- Health check: `GET /health`
- Start command in Dockerfile: database migrations, static-file collection, then Gunicorn bound to Render's `PORT`.

Required Render environment variables (values must remain in Render, not in Git):

```text
DATABASE_URL=<Supabase Session Pooler PostgreSQL URL>
DJANGO_SECRET_KEY=<strong unique secret>
DEBUG=False
ALLOWED_HOSTS=uvah.onrender.com
CSRF_TRUSTED_ORIGINS=https://uvah.onrender.com
```

The Supabase direct database host resolved to IPv6 from Render and failed with a network-unreachable error. The Session Pooler connection URL is the production solution used for Phase 1.

Deploy backend changes by committing and pushing the repository's `master` branch. Render is set to deploy on commit. Confirm completion with:

```text
https://uvah.onrender.com/health
```

Expected response:

```json
{"status":"ok"}
```

## Authentication persistence

The app stores access and refresh tokens locally and restores the session at launch. Access tokens last 24 hours; refresh tokens last 30 days. The app refreshes the access token when possible and keeps an existing access token usable when the device starts offline.

This means a normal user does not need to log in every time they reopen the app. A future hardening task is moving token storage from AsyncStorage to Android Keystore/iOS Keychain-backed storage.

Registration requires a unique username and a password of at least six characters. The registration screen now shows Django's field-level validation message instead of only a generic failure message.

## Phase 1 safety behaviour

### Included

- Manual SOS activation with confirmation.
- A fresh, real device location is required before an SOS is created. No simulated or random fallback coordinate is sent.
- The first location is stored before friends receive the SOS notification.
- Accepted friends receive an in-app SOS notification and can tap it to open the live-location view.
- An active Android SOS starts a foreground location service. It displays a persistent Android notification and continues sending location updates while the app is backgrounded.
- Stopping SOS calls the backend cancel endpoint first, then stops the local sharing service.
- Check-ins, friend relationships, location sharing, and the in-app notification inbox.

### Explicit Phase 1 limits

- Notifications are in-app polling only. There is no Firebase Cloud Messaging (FCM), so a friend whose app is closed is not alerted immediately.
- Saved emergency contacts are stored in the profile but are not contacted automatically. SMS/call/WhatsApp automation is deferred.
- The Android foreground service is for an active SOS started while UVAH is open. It is not a promise of continued tracking after an OS force-stop, battery restriction, or expired login token.
- iOS background location support has not been implemented.
- A Volume Down hardware SOS trigger has not been implemented. Android restricts reliable volume-button interception in the background and on the lock screen. Do not advertise this feature in Phase 1.
- Profile toggles that do not yet change a persisted server/device setting should not be presented as safety guarantees.

Recommended Phase 2 shortcut: offer an opt-in Android Quick Settings SOS tile or app-icon shortcut. It is more reliable and policy-safe than using the Volume Down button as a global trigger.

## Android build and install

The current internal build version is `1.0.1` (version code `2`). Build from Command Prompt:

```bat
cd C:\Users\ndlal\uvah\mobile-app\android
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot"
.\gradlew.bat app:assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon
```

The output APK is:

```text
mobile-app\android\app\build\outputs\apk\release\app-release.apk
```

The release build currently uses the debug signing key, which is acceptable only for internal testing. Create a private release keystore and configure a real release signing configuration before Play Store distribution or public sharing.

The build currently targets `arm64-v8a`, which supports most current physical Android phones. Add other ABIs before broader testing if needed.

## Git hygiene

The Android project source must be committed; it was previously hidden by a broad `android/` ignore rule. `.gitignore` now excludes only generated Android files such as Gradle caches, `app/build`, `app/.cxx`, and `local.properties`.

Before committing, review the staged files:

```bat
git add .
git status
git diff --cached
```

Never commit `.env` files, database passwords, Django secrets, Render deploy hooks, API keys, `local.properties`, signing keys, or screenshots containing them. Any secret previously exposed in screenshots, chat, or commits should be regenerated in its provider dashboard.

## Release checklist

- [ ] Render `/health` returns `{"status":"ok"}`.
- [ ] Register a new test user on a physical device using the production APK.
- [ ] Log out and log in; close and reopen the app to verify session restoration.
- [ ] Add two test users as friends and confirm both accept location sharing.
- [ ] Start SOS with device location enabled; verify the friend sees the in-app SOS item and can open the live map.
- [ ] Put the SOS sender app in the background; verify the Android foreground-service notification remains visible and locations continue updating.
- [ ] Stop SOS; verify the service notification disappears and the alert is canceled on the backend.
- [ ] Test denial of location permission and confirm SOS does not send a fake location.
- [ ] Rotate exposed secrets and restrict the Google Maps Android key to the UVAH package name and signing certificate.
- [ ] Create and secure a real Android release keystore before public distribution.
