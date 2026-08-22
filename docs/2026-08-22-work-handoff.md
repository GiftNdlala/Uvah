# Uvah work handoff — 22 August 2026

This document records the work completed on the Uvah mobile app and Django API on 22 August 2026, the exact state of the Firebase notification setup, the map/UI work, the Supabase avatar-bucket work, the Android build history, and everything that still needs to be completed or tested.

## 1. Executive status

### Completed in code

- The Maps tab was changed to use a full-bleed map with interface elements floating over the map.
- The unwanted bottom/safe-area gaps affecting the app's tab pages were addressed.
- The map controls and Uvah branding were moved into the map overlay layout.
- Firebase Android client configuration was added for package `com.uvahmobile`.
- Firebase Cloud Messaging (FCM) packages were installed and wired into the React Native app.
- The mobile notification layer was hardened with push-token registration, token rotation, foreground handling, background handling, notification channels, notification-tap routing, duplicate suppression, and polling fallback.
- The Django notification layer was hardened with durable database notifications, push-delivery metadata, Firebase Admin delivery, invalid-token cleanup, retry scheduling, and a retry-worker management command.
- SOS notification records are now created inside the same database transaction as the alert instead of being silently discarded when notification creation fails.
- A Supabase SQL script for a protected `avatars` bucket was created.
- A React Native JavaScript bundle completed successfully after the Firebase changes.
- The Firebase/React Native dependencies completed installation successfully. They are pinned to version `26.1.0`.

### Still required before notifications are live in production

1. Add a Firebase service-account JSON file to the deployed Django service as a secret. This is different from `google-services.json`.
2. Deploy the new backend requirements and code.
3. Allow the existing Docker startup command to run the Django migration automatically during deployment.
4. Decide how to host the push retry loop. Render does not offer free Background Workers; the web request still performs immediate FCM delivery without a separate worker.
5. Install a fresh debug APK on at least two real Android devices and test notifications in foreground, background, and killed-app states.
6. Test an SOS alert end to end between two separate user accounts and two separate devices.

### Important current limitation

The Supabase SQL creates and protects the bucket, but SQL by itself does **not** switch Django's existing `AccountProfile.avatar` image field from its current storage to Supabase Storage. The backend storage integration still needs to be implemented and configured with Supabase server credentials before profile photos are actually uploaded to that bucket.

### Recommendation at the end of 22 August

Do not start more feature work tonight. Preserve the current state. The sensible next session is deployment configuration plus real-device testing. The long Android debug build completed successfully and must not be repeated tonight.

## 2. User goals covered by this work

The requested outcomes were:

1. Remove the visible gap around the Maps tab and make the map fill the screen.
2. Float the navigation and Uvah identity over the map.
3. Make the map buttons responsive.
4. Make notification delivery, especially SOS alerts, much more reliable.
5. Connect profile-picture storage to a Supabase bucket and provide the SQL.
6. Configure Firebase for Android push notifications.
7. Provide three commands for cleaning old Android build outputs and creating a new release APK.

The frontend, Firebase client, notification architecture, SQL, and build commands have been addressed. Production backend deployment, end-to-end device verification, and the actual Django-to-Supabase upload integration remain.

## 3. Map and app-layout work

### Active map screen

The main map used by the bottom Maps tab is:

`mobile-app/src/screens/main/FriendsMapScreen.js`

The map was moved into a full-bleed layout and the surrounding elements were changed to overlays. The intended stacking order is:

1. Full-screen map at the back.
2. Uvah branding/header overlay at the top.
3. Map action buttons over the right side of the map.
4. Bottom tab navigation over the map.

### Related frontend files changed during the broader UI work

- `mobile-app/App.js`
- `mobile-app/android/app/src/main/java/com/uvahmobile/MainActivity.kt`
- `mobile-app/src/components/ScreenShell.js`
- `mobile-app/src/components/TrustedCircleMap.js`
- `mobile-app/src/components/UvahBrandBar.js`
- `mobile-app/src/components/HomeMapReplacement.js`
- `mobile-app/src/navigation/AppNavigator.js`
- `mobile-app/src/screens/auth/LoginScreen.js`
- `mobile-app/src/screens/auth/RegisterScreen.js`
- `mobile-app/src/screens/main/AlertsScreen.js`
- `mobile-app/src/screens/main/ContactsScreen.js`
- `mobile-app/src/screens/main/FriendsMapScreen.js`
- `mobile-app/src/screens/main/HomeScreen.js`
- `mobile-app/src/screens/main/MapScreen.js`
- `mobile-app/src/screens/main/ProfileScreen.js`

Some of these changes existed before the Firebase work. The working tree was already dirty. Do not use `git reset --hard`, do not discard the entire working tree, and do not assume every modified file belongs only to the Firebase task.

### Map verification still required

On a real Android phone, verify all of the following:

- There is no strip of background between the map and the top overlay.
- There is no strip of background between the page content and the bottom tab bar on any tab.
- The Uvah brand remains readable over both light and dark map areas.
- The floating buttons accept taps and are not blocked by another invisible view.
- The location/recentre button actually moves the map to the user's position.
- The friend/user focus controls move the camera to the intended marker.
- Android status-bar and navigation-bar insets look correct on both gesture-navigation and three-button-navigation phones.
- Opening another tab and returning to Maps does not freeze the UI.

## 4. Firebase Android client configuration

### Firebase project information supplied

- Project ID: `uvah-d677e`
- Project number: `996673808034`
- Android app ID: `1:996673808034:android:f2a47e5bb82fcc494ad9fb`
- Android package name: `com.uvahmobile`
- Firebase Storage bucket shown in the client configuration: `uvah-d677e.firebasestorage.app`

The Android package in Firebase matches the app package, which is required.

### Client configuration file

The copied JSON was normalized and saved at:

`mobile-app/android/app/google-services.json`

The Firebase client API key in `google-services.json` identifies the Firebase project to the Android client. It is not the private Firebase Admin credential used by the backend. The private service-account JSON must never be committed, pasted into chat, or bundled into the APK.

### Installed mobile packages

The following packages are pinned in `mobile-app/package.json` and the lockfile:

- `@react-native-firebase/app`: `26.1.0`
- `@react-native-firebase/messaging`: `26.1.0`

The install completed after approximately 17 minutes. NPM reported 22 audit findings: 1 low, 8 moderate, 11 high, and 2 critical. Do not run `npm audit fix --force` blindly because it can introduce breaking upgrades. Those findings should be reviewed separately.

### Android build-system changes

`mobile-app/android/build.gradle`

- Added Google Services Gradle plugin classpath `com.google.gms:google-services:4.4.4`.

`mobile-app/android/app/build.gradle`

- Applied the `com.google.gms.google-services` plugin.

`mobile-app/android/gradle.properties`

- Enabled React Native's New Architecture because React Native Firebase 26 requires it in this project setup.

`mobile-app/android/app/src/main/AndroidManifest.xml`

- Added the XML tools namespace.
- Configured the default notification channel as `uvah-updates-v1`.
- Added `tools:replace="android:value"` to resolve a manifest merge conflict over the default channel metadata.
- The app already had the Android notification and location permissions needed by this work.

### JavaScript entry point

`mobile-app/index.js`

- Registers Firebase Messaging's background-message handler before the app is mounted.

### iOS status

iOS Firebase push notification setup has not been performed. A future iOS release needs its own Firebase iOS app, `GoogleService-Info.plist`, APNs key/certificate configuration, Xcode capabilities, and iOS device testing.

## 5. Mobile notification hardening

### Main notification service

`mobile-app/src/services/notificationService.js` now provides the mobile push-notification layer.

It includes:

- Android channel creation.
- Notification permission requests.
- A persistent device identifier.
- FCM token acquisition and registration.
- FCM token refresh handling.
- Token removal/deactivation during logout.
- Foreground FCM message display through Notifee.
- Background FCM message handling.
- Notification-open handling when the app was in the background.
- Initial-notification handling when a notification launched a killed app.
- Notifee press-event handling.
- Local memory of delivered notification IDs for duplicate suppression.
- Separate handling for high-priority SOS alerts and normal updates.

### Android notification channels

- Emergency/SOS channel: `uvah-emergency-v1`
  - High importance.
  - Sound and vibration enabled.
  - Lights enabled.
  - Public lock-screen visibility.
- General updates channel: `uvah-updates-v1`
  - Used for ordinary alerts and social notifications.

Versioned channel IDs are intentional. Android remembers channel settings after creation, so changing behavior reliably often requires a new channel ID.

### Notification context and polling fallback

`mobile-app/src/context/NotificationsContext.js` was replaced with a layered implementation.

It now:

- Polls recursively every 12 seconds instead of using an overlapping interval.
- Does not start a new polling request while the previous request is still running.
- Preserves the last successfully loaded notification list if a poll fails.
- Avoids producing duplicate local notifications based only on unread-count changes.
- Uses notification IDs for deduplication.
- Avoids alarming users with their entire historical unread backlog on the first install.
- Displays at most five local fallback notifications at once.
- Prioritizes SOS notifications in the fallback path.
- Only uses the local fallback when the backend record has not been marked as push-delivered.
- Refreshes push registration when authentication becomes available and when the app returns to the foreground.
- Routes notification taps to the relevant app destination.

### Notification tap behavior

- SOS notifications fetch the related alert and navigate to its detail screen.
- Check-in notifications navigate to the Alerts area.
- Friend-request notifications open the relevant social/friend interface.

### Navigation readiness

`mobile-app/src/utils/navigationRef.js`

- Queues navigation actions that arrive before React Navigation is ready.
- Exposes a flush function for pending navigation actions.

`mobile-app/src/navigation/AppNavigator.js`

- Flushes queued notification navigation once the navigator is ready.

This prevents a cold-start notification tap from being lost because the app's navigation tree has not mounted yet.

### Authentication/logout behavior

`mobile-app/src/context/AuthContext.js`

- Best-effort unregisters the current device's push token from the backend during logout before local authentication data is cleared.

The file is currently untracked in Git, even though it is part of the working app. Preserve it and review whether it should be added to version control.

### Mobile API behavior

The mobile app registers and unregisters devices using:

- `POST /api/social/push-tokens/register/`
- `POST /api/social/push-tokens/unregister/`

The registration payload includes the FCM token, platform, and persistent device ID.

## 6. Django notification hardening

### New/changed model fields

`backend-api/social/models.py`

The existing notification model now records:

- `push_attempts`
- `push_delivered_at`
- `push_next_attempt_at`
- `push_last_error`

These fields allow the backend to distinguish database persistence from push delivery and retry failed delivery without losing the original notification.

### Push-device model

A `PushDevice` model was added with:

- User ownership.
- Unique FCM token.
- Persistent device ID.
- Platform (`android` or `ios`).
- Active/inactive state.
- Creation timestamp.
- Last-seen timestamp.
- An index supporting active-device lookup per user.

Registering a new token for the same physical app installation rotates/deactivates the previous token. Invalid or expired Firebase tokens are also deactivated when Firebase rejects them.

### Database migration

The migration is:

`backend-api/social/migrations/0005_push_delivery.py`

It must be applied in production:

```powershell
python manage.py migrate
```

Do not mark the Firebase backend work as deployed until this migration succeeds.

### Firebase Admin delivery service

`backend-api/social/push.py`

The service:

- Initializes Firebase Admin through Application Default Credentials.
- Caches the initialized Firebase app.
- Looks up active devices for the target user.
- Sends multicast FCM messages in batches of at most 500 tokens.
- Supplies notification text and navigation data.
- Uses Android high priority for SOS alerts.
- Selects the emergency or normal Android channel based on notification type.
- Uses sound, tag, and time-to-live settings.
- Deactivates tokens Firebase reports as invalid or unregistered.
- Records delivery time when at least one target accepts the message.
- Records a sanitized last error when delivery fails.
- Schedules retry attempts with backoff.
- Stops endless retries after the configured attempt limit.

If no device is registered, the notification remains durable in the database and a later retry is scheduled. If Firebase credentials are unavailable, the notification also remains in the database and is scheduled for retry.

### Notification creation helpers

`backend-api/social/notify.py`

- Persists notifications first.
- Schedules immediate push delivery with `transaction.on_commit`.
- Provides helpers for SOS, check-in, friend-request, and other notification types.
- Ensures a push failure cannot roll back a notification that has already been committed.

### Social API endpoints

`backend-api/social/views.py` and `backend-api/social/urls.py`

- Added authenticated register/unregister push-token endpoints.
- Replaced direct friend-request notification creation with the shared durable notification helper.
- After a device token is registered, pending notifications can be delivered to that device.
- A user cannot unregister another user's device token.

`backend-api/social/serializers.py`

- Exposes `push_delivered_at` to the mobile app so the polling fallback knows whether a real push was accepted.

### SOS transaction change

`backend-api/alerts/views.py`

- SOS notification rows are created within the same transaction as the alert and location records.
- The old broad `except Exception: pass` behavior around alert notification creation was removed.
- A failure to create the durable notification is no longer silently ignored.
- Firebase sending happens only after the database transaction commits, so a temporary Firebase outage does not undo the SOS alert.

### Retry worker

The new management command is:

`backend-api/social/management/commands/deliver_push_notifications.py`

Recommended continuous worker command:

```powershell
python manage.py deliver_push_notifications --loop --interval 15
```

The web request attempts immediate delivery after commit. The worker provides reliability when immediate delivery fails, Firebase is temporarily unavailable, a token has just been registered, or a notification has reached its scheduled retry time.

The worker should run as a separate Render Background Worker or equivalent long-running process. It should not replace the web service.

### Backend dependency

`backend-api/requirements.txt`

- Added `firebase-admin>=7.1,<8`.

### Backend tests added

`backend-api/social/tests.py`

Tests were added for:

- SOS notification persistence before push dispatch.
- Push-token rotation for the same device.
- Preventing one user from unregistering another user's token.

These tests have not yet run locally because the checked-in/local virtual environment points to a Python executable that no longer exists, and no working system `python` or `py` command was available during this session. This is an environment limitation, not a reported test failure.

## 7. How the hardened notification flow works

### SOS creation and immediate delivery

1. A user triggers SOS.
2. Django validates the request and creates the alert/location data.
3. Django creates durable notification rows in the same transaction.
4. The database transaction commits.
5. An `on_commit` callback attempts FCM delivery to every active device token for each recipient.
6. Firebase/Android displays an emergency-channel push if delivery is accepted.
7. The notification record is marked with `push_delivered_at` when at least one device accepts it.
8. If the immediate attempt fails, retry metadata is stored for the worker.
9. If push still does not arrive but the user opens the app, 12-second polling remains as a fallback.

### Device registration

1. The user signs in and grants notification permission.
2. The mobile app obtains the FCM token.
3. The app sends the token, platform, and persistent device ID to Django.
4. Django activates the token for the authenticated user.
5. An older token belonging to the same device ID is deactivated.
6. Django attempts any eligible pending notifications for that user.
7. Firebase token-refresh events update the server automatically while the app is running.

### Logout

1. The app asks Django to deactivate the current token.
2. The app removes/deletes its local FCM token best-effort.
3. Authentication data is cleared.

This reduces the risk of one person's notifications reaching a phone after another user signs into the same installation.

### Reliability boundaries

The new design is substantially more reliable than foreground polling alone, but no mobile push system can guarantee instant delivery in every condition. Delivery may still be delayed by no network connection, Android battery restrictions, force-stop state, disabled notification permission, vendor-specific power management, an expired token, or Firebase/hosting outages. The durable database record and retry worker are designed to avoid silently losing the event.

## 8. Firebase server credential and Render setup

`google-services.json` configures the Android client only. The Django backend still needs a private Firebase service-account key.

### Create the service-account JSON

1. Open Firebase Console.
2. Select project `uvah-d677e`.
3. Open **Project settings**.
4. Open **Service accounts**.
5. Choose **Firebase Admin SDK**.
6. Select **Generate new private key**.
7. Confirm and download the JSON file.
8. Do not rename/paste/commit it until placing it in the hosting provider's secret-file interface.

This can be done from a phone browser using desktop-site mode, but using a computer is safer and easier for handling the secret file.

### Add the secret to Render

For the Django web service:

1. Open the backend service in Render.
2. Open **Environment**.
3. Add a Secret File named `firebase-service-account.json`.
4. Paste/upload the complete service-account JSON as the secret-file content.
5. Add environment variable:

   `GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/firebase-service-account.json`

6. Save the environment changes.
7. Redeploy the backend after the new code and requirements are available.

Repeat the same secret file and environment variable for the separate push retry worker.

### Deploy backend code and migrate on Render Free

Render Free does not provide Dashboard/SSH shell access and does not support the paid pre-deploy command. This repository does not require either feature for migrations because `backend-api/Dockerfile` already starts the service with:

`python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn ...`

Therefore, after the updated code is committed and pushed, add the Firebase secret and redeploy the Docker web service. The migration runs automatically before Gunicorn starts. In the Render deployment logs, look for migration output including `social.0005_push_delivery` followed by the Gunicorn startup/listening messages. A failed migration prevents the new web process from starting, which makes the failure visible in the deployment logs.

### Retry-worker limitation on Render Free

Render does not offer a Free instance type for Background Workers. This does not prevent immediate push delivery: every newly committed notification attempts Firebase delivery from the Django web request. Durable database notifications and the mobile polling fallback also continue to work.

The management command remains available:

`python manage.py deliver_push_notifications --loop --interval 15`

For testing on the free tier, it can be colocated with the web process in the Docker container, but it will run only while the Free web service is awake and it will share the web service's limited memory. Render spins a Free web service down after inactivity, so this is not equivalent to a continuously running worker. For a real safety-critical production launch, use a paid always-on service/worker or another always-on worker host.

### Never expose this credential

The service-account JSON grants privileged server access. Never:

- Put it under `mobile-app/`.
- Put it in the APK.
- Commit it to Git.
- Paste it into source code.
- Send it in a chat message.
- Store it in a public Firebase client environment variable.

## 9. Supabase avatar bucket

The SQL script is:

`docs/supabase_avatars_bucket.sql`

### What the SQL does

- Creates or updates a bucket with ID/name `avatars`.
- Makes object reads public so avatar URLs can be displayed without signed-URL refresh logic.
- Limits object size to 5 MB.
- Allows JPEG, PNG, and WebP MIME types.
- Removes client-side write policies with the names used by the script.
- Does not grant anonymous or ordinary authenticated client writes.

### Why client write policies are not enabled

The app authenticates through Django JWT, not Supabase Auth. Supabase Storage row-level policies cannot automatically treat a Django JWT user as `auth.uid()` unless a compatible Supabase JWT/auth integration is deliberately built. Therefore, direct client uploads would either fail or require dangerously broad write policies.

The secure intended design is:

1. The mobile app sends the selected photo to an authenticated Django endpoint.
2. Django validates ownership, MIME type, and file size.
3. Django uploads the object to `avatars/<user-id>/<generated-filename>` with the Supabase service-role credential.
4. Django stores the resulting object URL/path on the profile.
5. Replacing an avatar removes or supersedes the previous object safely.

### Backend integration still needed

The current profile avatar is still backed by Django's existing `ImageField`/storage behavior. The following work remains:

- Choose either a Django storage backend compatible with Supabase's S3 interface or a small explicit Supabase upload service.
- Add server-only environment variables such as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or S3-compatible endpoint credentials).
- Update the profile upload endpoint to use the bucket.
- Validate 5 MB and allowed MIME types on the server, not just the client.
- Generate collision-resistant object names.
- Test upload, replacement, deletion, and public display.
- Never ship the Supabase service-role key in the mobile app.

## 10. Android build history and current state

### Successful checks

- NPM dependency installation completed successfully.
- The React Native Metro production-style bundle completed with exit code 0 after Firebase wiring.
- Firebase Android config processing recognized the project and package.
- New Architecture autolinking and code generation passed.
- The Android manifest merge passed after the channel metadata conflict was fixed.
- Firebase Android resources and Java compilation passed.
- The app's Kotlin and Java compilation passed with deprecation warnings only.

### Build problems encountered and resolved

#### 1. Gradle/Firebase download certificate failure

Gradle initially failed with a PKIX SSL/certificate error while downloading Google's plugin/dependencies.

Resolved locally by setting:

```powershell
$env:JAVA_TOOL_OPTIONS = '-Djavax.net.ssl.trustStoreType=Windows-ROOT'
```

#### 2. React Native Firebase required New Architecture

After dependency resolution succeeded, React Native Firebase 26 reported that the project needed New Architecture enabled.

Resolved in `mobile-app/android/gradle.properties` by setting `newArchEnabled=true`.

#### 3. Default notification-channel manifest conflict

The Android manifest merger found two values for the Firebase default notification channel.

Resolved by adding the XML tools namespace and `tools:replace="android:value"` to the app's channel metadata.

### Final debug-build result

The cached debug build command was:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot'
$env:JAVA_TOOL_OPTIONS = '-Djavax.net.ssl.trustStoreType=Windows-ROOT'
.\gradlew.bat app:assembleDebug -PreactNativeDevServerPort=8081 -PreactNativeArchitectures=arm64-v8a --no-daemon
```

The build subsequently completed successfully:

- Final task: `app:assembleDebug`
- Result: `BUILD SUCCESSFUL`
- Exit code: `0`
- Total Gradle time: `1h 51m 38s`
- Tasks: 308 actionable tasks; 197 executed and 111 up to date

The build printed D8 stack-map-table warnings originating from `play-services-auth-21.5.0` and Gradle deprecation warnings, but neither caused the build to fail. The generated APK still requires real-device testing.

## 11. Three commands to clean old APK outputs and build a new release APK

Run these in PowerShell after testing is complete:

```powershell
Set-Location 'C:\Users\ndlal\uvah\mobile-app\android'
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-21.0.8.9-hotspot'; $env:JAVA_TOOL_OPTIONS = '-Djavax.net.ssl.trustStoreType=Windows-ROOT'; .\gradlew.bat clean
.\gradlew.bat app:assembleRelease --no-daemon
```

The release APK output should be:

`mobile-app/android/app/build/outputs/apk/release/app-release.apk`

`gradlew clean` removes old Gradle build outputs, including previously generated debug/release APK outputs, before the new release is built.

### Critical release-signing warning

The current release build configuration signs with the debug keystore. That is acceptable only for internal sideload testing. It is not a proper production/Play Store signing configuration.

Before publishing a production release:

1. Create or locate the permanent Uvah release keystore.
2. Back it up securely; losing it can prevent future updates outside Play App Signing recovery paths.
3. Store passwords outside source control, normally in a local/untracked Gradle properties file or CI/hosting secrets.
4. Update the release signing configuration.
5. Increment `versionCode` from its current value (`3`).
6. Update `versionName` from its current value (`1.0.2`) as appropriate.
7. Prefer an Android App Bundle for Play Store upload:

   `./gradlew app:bundleRelease`

## 12. Verification checklist for tomorrow

### A. Install the successful debug build

- The existing build ended with `BUILD SUCCESSFUL` and exit code 0.
- Locate `mobile-app/android/app/build/outputs/apk/debug/app-debug.apk`.
- Do not run `clean` before installing/testing the successful debug APK.

### B. Backend static/test environment

- Repair or recreate the Python virtual environment.
- Install updated requirements.
- Run:

```powershell
python manage.py makemigrations --check
python manage.py test social
python manage.py check
```

- Review any failure before deploying.

### C. Firebase/Render

- Add the service-account Secret File.
- Add `GOOGLE_APPLICATION_CREDENTIALS`.
- Deploy the Docker web service; its existing startup command automatically runs migration `0005_push_delivery` before Gunicorn.
- Confirm the migration and Gunicorn startup in the deployment logs.
- Choose a retry-worker host; a separate Render Background Worker is not available on Render Free.
- Confirm the backend logs show Firebase initialized successfully.

### D. Android device registration

- Install the new APK.
- Sign in.
- Grant notification permission.
- Confirm a `PushDevice` row is created for the user.
- Sign out and confirm the token becomes inactive.
- Sign back in and confirm a valid active token exists.

### E. Notification delivery matrix

Use two users on two real phones. Test each notification type with the recipient app:

| Notification | Foreground | Background | Killed/swiped away | Tap destination |
|---|---:|---:|---:|---|
| SOS | Test | Test | Test | Alert detail |
| Check-in | Test | Test | Test | Alerts tab |
| Friend request | Test | Test | Test | Friend/social panel |
| Friend accepted | Test | Test | Test | Appropriate social screen |
| General alert | Test | Test | Test | Appropriate screen |

For SOS specifically, also verify:

- Emergency channel sound/vibration.
- Delivery to every intended trusted contact.
- Database notification exists even if Firebase is temporarily unavailable.
- Retry worker later delivers a failed eligible notification.
- Duplicate push/local fallback is not displayed.
- Alert still appears when the recipient opens the app after being offline.

### F. Map/UI matrix

- Test Maps tab on the target Samsung/Android device shown in the supplied screenshot.
- Test at least one device with gesture navigation.
- Test status-bar inset, bottom inset, overlay buttons, marker taps, and tab changes.
- Test returning to Maps repeatedly for freezing/regressions.

### G. Supabase avatar integration

- Run `docs/supabase_avatars_bucket.sql` in the Supabase SQL Editor.
- Verify the bucket settings in Storage.
- Implement the Django-to-Supabase upload path.
- Add secret server credentials.
- Test upload/replace/delete/display before considering this complete.

### H. Release preparation

- Configure real release signing.
- Increment app version.
- Run the three clean/release commands.
- Install the release APK on a device or upload a signed AAB to the intended testing track.
- Repeat at least the SOS, map, login/logout, and avatar smoke tests in the release build.

## 13. Estimated remaining time

These are realistic working estimates, assuming credentials and hosting access are available and no new platform-specific error appears:

- Confirm/install the completed debug APK: 5–15 minutes.
- Repair backend Python environment and run checks: 15–40 minutes.
- Firebase service-account/Render setup and migration: 15–30 minutes.
- Configure and verify retry worker: 10–20 minutes.
- Two-device push/SOS test matrix: 30–60 minutes.
- Run the Supabase bucket SQL: about 5 minutes.
- Implement and test Django-to-Supabase avatar uploads: 30–90 minutes depending on the existing upload endpoint and chosen storage adapter.
- Configure proper release signing/versioning and create the final artifact: 20–45 minutes if a permanent keystore is available; longer if signing ownership must be decided.

The minimum path to a tested Firebase/SOS debug build is roughly 1–2 hours tomorrow. Completing profile-photo storage and production release signing can bring the remaining work closer to 2–4 hours.

## 14. Known risks and cautions

1. **Dirty working tree:** many modified files predate or overlap this task. Preserve them and review changes file by file.
2. **Untracked important files:** notification/backend additions, `AuthContext.js`, the Firebase client JSON, migrations, and docs are currently untracked.
3. **Generated directories:** `mobile-app/.npm-cache/` and `mobile-app/android/.kotlin/` are generated and generally should not be committed.
4. **Private credentials:** no Firebase Admin service-account JSON should enter Git. The Android `google-services.json` is client configuration, not the Admin key.
5. **Backend tests not run:** local Python is unavailable/broken; run tests before production deployment.
6. **New Architecture:** enabling it was required for the selected React Native Firebase version. The custom `SOSLocationPackage` and all native modules need real-device verification.
7. **Google D8 warnings:** the ongoing build printed warnings from `play-services-auth`. Judge the build by its final status and test the APK on a device.
8. **Release signing:** the current release configuration uses the debug keystore and is not production-ready.
9. **Profile storage incomplete:** the bucket SQL exists, but Django upload integration is not yet implemented.
10. **Push is not absolute delivery:** Android permissions, force-stop state, power management, network availability, and vendor restrictions can still delay notifications. The database and polling fallback mitigate loss but cannot override the operating system.

## 15. Files created specifically for notification/storage work

- `backend-api/social/management/commands/deliver_push_notifications.py`
- `backend-api/social/migrations/0005_push_delivery.py`
- `backend-api/social/push.py`
- `backend-api/social/tests.py`
- `docs/supabase_avatars_bucket.sql`
- `mobile-app/android/app/google-services.json`

Major existing files changed for notification work:

- `backend-api/alerts/views.py`
- `backend-api/requirements.txt`
- `backend-api/social/models.py`
- `backend-api/social/notify.py`
- `backend-api/social/serializers.py`
- `backend-api/social/urls.py`
- `backend-api/social/views.py`
- `mobile-app/android/app/build.gradle`
- `mobile-app/android/app/src/main/AndroidManifest.xml`
- `mobile-app/android/build.gradle`
- `mobile-app/android/gradle.properties`
- `mobile-app/index.js`
- `mobile-app/package.json`
- `mobile-app/package-lock.json`
- `mobile-app/src/context/AuthContext.js`
- `mobile-app/src/context/NotificationsContext.js`
- `mobile-app/src/navigation/AppNavigator.js`
- `mobile-app/src/services/notificationService.js`
- `mobile-app/src/utils/navigationRef.js`

## 16. Official references

- React Native Firebase Cloud Messaging usage: <https://rnfirebase.io/messaging/usage>
- Firebase Admin SDK setup: <https://firebase.google.com/docs/admin/setup>
- Firebase server environment guidance: <https://firebase.google.com/docs/cloud-messaging/server-environment>
- Supabase Storage access control: <https://supabase.com/docs/guides/storage/security/access-control>
- Supabase bucket creation: <https://supabase.com/docs/guides/storage/buckets/creating-buckets>
- Render environment variables and secret files: <https://render.com/docs/configure-environment-variables>

## 17. Safe restart point

When work resumes, use this order:

1. Read this handoff.
2. Use the successful debug APK already produced; do not immediately rebuild it.
3. Inspect the working tree without resetting anything.
4. Repair Python/run backend checks.
5. Configure the Firebase Admin secret on Render.
6. Deploy and migrate.
7. Start the retry worker.
8. Install the debug APK on two phones.
9. Run the notification and map test matrices.
10. Implement/test Supabase avatar upload integration.
11. Configure real release signing and build the release only after the debug tests pass.
