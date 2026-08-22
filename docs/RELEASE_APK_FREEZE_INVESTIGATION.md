# Release APK Navigation Freeze Investigation

**Date:** 2026-08-17  
**Status:** Open — the latest release APK still freezes after the fixes below.  
**Scope:** `mobile-app` Android release APK (`com.uvahmobile`)

## User-visible behaviour

- The installed release APK launches successfully and reaches the Home screen.
- The Home screen's normal React Native controls and the bottom-tab navigation do not respond.
- The small Google Map on Home can still be panned, but it does not show the user's location.
- The equivalent Metro/development run does not show the same complete navigation freeze.
- The release APK has not produced a new JavaScript or Android fatal exception during the later freeze reports.

This distinction matters: the map is a native Google Maps view and can continue receiving native gestures even when React Native navigation/touch handling is unavailable or its state is reset.

## APK and device evidence

### Release artifact

- Local artifact: `mobile-app/android/app/build/outputs/apk/release/app-release.apk`
- SHA-256 observed locally: `CBC0085C447FE6F7C8E6CBD5FA2F74C7B5E2D572EE3ACDDDB64BC96DC88D51F4`
- It contains `assets/index.android.bundle` and `lib/arm64-v8a/libhermes.so`, confirming it is a bundled React Native/Hermes release build.

### Initial Android crash

The first device log contained this crash before the Android activity fix:

```text
java.lang.IllegalStateException: Screen fragments should never be restored.
at com.swmansion.rnscreens.ScreenFragment
```

This was a genuine `react-native-screens` Android fragment-restoration crash. It was distinct from the later no-crash navigation freeze.

### Later freeze log

The later log showed:

- `ReactNativeJS: Running "UvahMobile"`
- No `FATAL EXCEPTION`, `AndroidRuntime`, or `ReactNativeJS` error associated with the freeze.
- Long UI-thread contention during Google Maps initialization, including waits of approximately 2–4 seconds and a temporary frame rate near 1 FPS.

The Google Maps entries can explain launch lag, but they do **not** explain the user-reported pattern by themselves: all React controls are unavailable while the embedded native map remains draggable.

## Source diagnosis reviewed

[`onStateChange.md`](../onStateChange.md) documented a navigation/authentication concern. Before changes, `src/navigation/AppNavigator.js` used:

```js
onStateChange={async () => {
  setIsAuthenticated(await hasStoredSession());
}}
```

That callback ran after every navigation state change. Authentication was also managed locally in the navigator, while login, registration, logout, and `401` handling changed tokens/navigation independently.

The document's proposed architecture (one shared auth state and no per-navigation session check) is a sound hardening improvement. However, the callback alone was not proven to be the complete root cause: `hasStoredSession()` reads AsyncStorage and repeatedly setting `true` normally does not reset a stack. The reported freeze remains unresolved after implementing the architecture.

## Changes applied

### 1. Android screen-fragment restoration fix

**File:** `mobile-app/android/app/src/main/java/com/uvahmobile/MainActivity.kt`

Added:

```kotlin
import android.os.Bundle

override fun onCreate(savedInstanceState: Bundle?) {
  super.onCreate(null)
}
```

Purpose: prevent Android from restoring `react-native-screens` fragments after activity/process recreation.

### 2. Shared authentication state

**New files:**

- `mobile-app/src/context/AuthContext.js`
- `mobile-app/src/context/authSessionEvents.js`

`AuthProvider` now restores a session once on app startup, exposes `isAuthenticated`, `isLoading`, `setIsAuthenticated`, and `logout`, and handles session-expiry notifications from the API layer.

### 3. App provider wiring

**File:** `mobile-app/App.js`

`AppNavigator` is now wrapped in `AuthProvider` inside `SafeAreaProvider`.

### 4. Navigation rewrite

**File:** `mobile-app/src/navigation/AppNavigator.js`

- Removed the `NavigationContainer.onStateChange` async session check.
- Removed navigator-local auth state and startup session restoration.
- Uses `AuthContext` instead.
- Renders separate guest and authenticated screen sets; changing auth remounts the stack with a different key.

### 5. Login and registration flow

**Files:**

- `mobile-app/src/screens/auth/LoginScreen.js`
- `mobile-app/src/screens/auth/RegisterScreen.js`

After storing tokens or enabling demo mode, these screens now call `setIsAuthenticated(true)` rather than manually navigating to `MainApp`.

### 6. Logout and unauthorized handling

**Files:**

- `mobile-app/src/screens/main/ProfileScreen.js`
- `mobile-app/src/api/client.js`

- Profile logout calls `AuthContext.logout()`.
- Failed token refresh / unrecoverable `401` responses notify `AuthContext` instead of directly resetting the navigation ref.
- The same behavior was added to failed authenticated uploads.

## Verification performed

- `git diff --check` reported no whitespace errors.
- All changed JavaScript files were parsed with `@babel/parser`; result: `JavaScript syntax OK`.
- A release bundle Gradle task was attempted locally. Sandbox network restrictions prevented a complete independent Gradle verification; the user successfully rebuilt and installed a release APK afterward.

## Result after changes

- The initial `react-native-screens` fragment-restoration crash was addressed.
- The user rebuilt, installed, and tested a new release APK.
- The Home screen / tab navigation freeze still occurs.

Therefore, the AuthContext/navigation rewrite did not resolve the primary freeze. It should remain as a safer architecture, but it must not be treated as the final root-cause fix.

## Next diagnostic steps

The next capture must occur while the app is visibly frozen, not immediately after clearing Logcat.

1. Clear logs:

   ```cmd
   "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" logcat -c
   ```

2. Open the installed release APK and reproduce the frozen state.

3. Obtain the process ID:

   ```cmd
   "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" shell pidof com.uvahmobile
   ```

4. Capture relevant logs:

   ```cmd
   "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" logcat -d -v time | findstr /I "uvahmobile ReactNativeJS AndroidRuntime FATAL EXCEPTION ANR Choreographer"
   ```

5. While frozen, obtain an Android thread dump (replace `PID` with the result from step 3):

   ```cmd
   "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" shell kill -3 PID
   "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" logcat -d -v time | findstr /I "DALVIK THREADS com.uvahmobile ReactNative Hermes"
   ```

6. Record the exact interaction sequence and whether the visual tab selection changes when tapped. This distinguishes an input-dispatch problem from navigation state immediately reverting.

## Current conclusion

The primary release-only freeze is still unconfirmed. Current evidence supports further investigation of React Native input dispatch, the JavaScript/UI thread during the freeze, and release-only differences in installed state. The map initialization contention is secondary evidence of poor startup performance, not the confirmed cause of the complete navigation lock.
