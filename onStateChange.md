# Navigation Lock Issue: `onStateChange` Race Condition

**Date:** 2026-08-17  
**Status:** Diagnosed  
**Severity:** High (User-Blocking)  
**Component:** React Native Mobile App - Navigation & Authentication

---

## Executive Summary

After successful login/registration, the Uvah mobile app navigates to the home page but becomes **frozen**—users cannot access other tabs or screens. The backend is healthy (200/201 responses logged), confirming this is a **frontend-only navigation state issue**.

**Root Cause:** The `onStateChange` callback in `AppNavigator.js` re-evaluates authentication on every navigation action, causing race conditions that reset the navigation stack unexpectedly.

---

## Problem Description

### Current Behavior
1. ✅ User successfully registers or logs in via backend API (201/200 responses)
2. ✅ JWT tokens are stored (access & refresh)
3. ✅ `LoginScreen` calls `navigation.replace('MainApp')`
4. ✅ User briefly sees `HomeScreen` with tab bar (Home, Friends, Map, Alerts, Profile)
5. ❌ **Any tab tap causes app to re-lock on home page**
6. ❌ User cannot navigate to Friends, Map, Alerts, or Profile screens
7. ❌ No error message—just silent navigation failure

### Backend Logs (Healthy)
The backend service at https://uvah.onrender.com is working correctly:

```log
[2026-08-17 07:49:41 +0000] "POST /api/accounts/auth/register/ HTTP/1.1" 201 564 "-" "okhttp/4.12.0"
[2026-08-17 07:49:43 +0000] "GET /api/accounts/profile/me/ HTTP/1.1" 200 142 "-" "okhttp/4.12.0"
[2026-08-17 07:49:44 +0000] "GET /api/social/location/friends/ HTTP/1.1" 200 52 "-" "okhttp/4.12.0"
[2026-08-17 07:49:44 +0000] "GET /api/social/notifications/ HTTP/1.1" 200 52 "-" "okhttp/4.12.0"
[2026-08-17 07:49:45 +0000] "GET /api/alerts/my-alerts/?status=active HTTP/1.1" 200 2 "-" "okhttp/4.12.0"
[2026-08-17 07:54:23 +0000] "POST /api/accounts/auth/refresh/ HTTP/1.1" 200 223 "-" "okhttp/4.12.0"
[2026-08-17 07:54:25 +0000] "GET /api/accounts/profile/me/ HTTP/1.1" 200 142 "-" "okhttp/4.12.0"
[2026-08-17 07:54:26 +0000] "GET /api/social/location/friends/ HTTP/1.1" 200 52 "-" "okhttp/4.12.0"
[2026-08-17 07:54:26 +0000] "GET /api/social/location/friends/ HTTP/1.1" 200 52 "-" "okhttp/4.12.0"
[2026-08-17 07:54:27 +0000] "GET /api/accounts/profile/me/ HTTP/1.1" 200 142 "-" "okhttp/4.12.0"
[2026-08-17 07:54:27 +0000] "GET /api/social/notifications/ HTTP/1.1" 200 52 "-" "okhttp/4.12.0"
[2026-08-17 07:54:28 +0000] "POST /api/social/location/update/ HTTP/1.1" 200 11 "-" "okhttp/4.12.0"
[2026-08-17 07:54:29 +0000] "POST /api/social/location/update/ HTTP/1.1" 200 11 "-" "okhttp/4.12.0"
```

**All API endpoints responding correctly:**
- `POST /api/accounts/auth/register/` → 201 Created ✅
- `POST /api/accounts/auth/refresh/` → 200 OK ✅
- `GET /api/accounts/profile/me/` → 200 OK ✅
- `GET /api/social/location/friends/` → 200 OK ✅
- `GET /api/social/notifications/` → 200 OK ✅
- `GET /api/alerts/my-alerts/` → 200 OK ✅
- `POST /api/social/location/update/` → 200 OK ✅

**Conclusion:** Backend is working perfectly. Issue is 100% frontend/client-side.

---

## Root Cause Analysis

### Issue 1: Problematic `onStateChange` Callback

**File:** `mobile-app/src/navigation/AppNavigator.js` (Lines 125-132)

```javascript
<NavigationContainer
  theme={navTheme}
  ref={navigationRef}
  onStateChange={async () => {
    try {
      setIsAuthenticated(await hasStoredSession());
    } catch (_) {}
  }}
>
```

#### How It Breaks Navigation

1. **Constant Re-evaluation:** The callback executes on **every navigation state change**
   - User taps "Friends" tab → `onStateChange` fires
   - Calls `hasStoredSession()` asynchronously
   - If timing is wrong, it might evaluate to `false` mid-navigation

2. **Race Condition:** 
   - Navigation changes → `onStateChange` starts async check
   - User's token is valid, but async function is still pending
   - Meanwhile, navigation tries to switch to "Friends" tab
   - If `setIsAuthenticated(false)` fires at the wrong moment, the entire stack resets to Login

3. **No Protection:** There's no debouncing, no flag to skip re-evaluation on user-triggered navigation

### Issue 2: Missing Auth Context Pattern

**Current Implementation:**
- AppNavigator uses `isAuthenticated` state directly
- LoginScreen/RegisterScreen set tokens but **don't notify** the parent component
- Authentication state is checked only on initial mount
- No synchronization mechanism between login success and navigator updates

**The Gap:**
```javascript
// LoginScreen.js
await setTokens({ access, refresh }); // Token stored ✅
navigation.replace('MainApp');         // Navigation called ✅
// But AppNavigator doesn't "know" auth succeeded!
```

### Issue 3: Providers Re-mount on Auth Changes

**File:** `mobile-app/src/navigation/AppNavigator.js` (Lines 127-129)

```javascript
<NotificationsProvider enabled={isAuthenticated}>
<FriendLocationsProvider enabled={isAuthenticated}>
```

When `isAuthenticated` changes:
- Both providers disable/re-enable
- Their internal state resets
- Screens depending on `useFriendLocations()` and `useNotifications()` lose their data
- UI fails silently or shows stale data

### Issue 4: Navigation Stack Not Protected After Login

**Current Stack Configuration:**
```javascript
<Stack.Navigator initialRouteName={isAuthenticated ? 'MainApp' : 'Login'}>
  <Stack.Screen name="Login" component={LoginScreen} />
  <Stack.Screen name="Register" component={RegisterScreen} />
  <Stack.Screen name="MainApp" component={MainTabNavigator} />
  // ... detail screens
</Stack.Navigator>
```

**Problem:**
- `initialRouteName` is evaluated only once on mount
- If `isAuthenticated` changes after mount, the Navigator doesn't automatically switch stacks
- The `onStateChange` hook tries to force this, but does so unsafely

---

## Sequence Diagram: Current Broken Flow

```
User                    LoginScreen              AppNavigator           Navigation
 |                           |                        |                      |
 | Tap Login                 |                        |                      |
 +-------------------------->|                        |                      |
 |                           | POST /login            |                      |
 |                           +----------------------->| (backend)            |
 |                           |<-----------201 OK------+                      |
 |                           | setTokens()            |                      |
 |                           | navigate('MainApp')    |                      |
 |                           +------>onStateChange----+                      |
 |                           |       (async)          |                      |
 |                           |                        | hasStoredSession()  |
 |                           |                        | (async, pending...) |
 |                           |                        |                      |
 | [UI shows home]           |                        |                      | Switch to MainApp
 |                           |                        |                      |
 | Tap Friends tab           |                        |                      | Navigate to Friends
 |                           |                        |                      | (onStateChange fires again!)
 |                           |                        | hasStoredSession()   |
 |                           |                        | (race condition!)    |
 |                           |                        | setIsAuthenticated(?) |
 |                           |                        |                      | ❌ Stack resets to Login
 | [App locks on Home]       |                        |                      |
```

---

## Recommended Fix

### **Fix 1: Create Auth Context (Recommended)**

Create a new file: `mobile-app/src/context/AuthContext.js`

```javascript
import React, { createContext, useEffect, useState } from 'react';
import { restoreSession } from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsAuthenticated(await restoreSession());
      } catch (_) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth(); // Only runs ONCE on mount
  }, []); // Empty dependency array = mount only

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);
```

### **Fix 2: Wrap App with AuthProvider**

Update: `mobile-app/App.js` (or main entry point)

```javascript
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
```

### **Fix 3: Update AppNavigator to Use Auth Context**

Update: `mobile-app/src/navigation/AppNavigator.js`

```javascript
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../utils/navigationRef';
// ... other imports

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ScreenShell>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={styles.loadingText}>Loading Uvah</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
      <NotificationsProvider enabled={isAuthenticated}>
        <FriendLocationsProvider enabled={isAuthenticated}>
          <Stack.Navigator 
            screenOptions={{ headerShown: false }}
          >
            {isAuthenticated ? (
              <Stack.Group>
                <Stack.Screen name="MainApp" component={MainTabNavigator} />
                <Stack.Screen 
                  name="FriendDetail" 
                  component={FriendDetailScreen} 
                  options={{ headerShown: true, title: 'Friend Detail' }} 
                />
                <Stack.Screen 
                  name="AlertDetail" 
                  component={AlertDetailScreen} 
                  options={{ headerShown: true, title: 'Alert Detail' }} 
                />
                <Stack.Screen 
                  name="EditProfile" 
                  component={EditProfileScreen} 
                  options={{ headerShown: true, title: 'Edit Profile' }} 
                />
                <Stack.Screen 
                  name="EditEmergencyContact" 
                  component={EditEmergencyContactScreen} 
                  options={{ headerShown: true, title: 'Emergency Contact' }} 
                />
              </Stack.Group>
            ) : (
              <Stack.Group>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
              </Stack.Group>
            )}
          </Stack.Navigator>
        </FriendLocationsProvider>
      </NotificationsProvider>
    </NavigationContainer>
  );
};

export default AppNavigator;
```

**Key Changes:**
- ✅ Remove `onStateChange` callback entirely
- ✅ Remove initial `useEffect` that checked auth
- ✅ Use conditional `Stack.Group` for auth vs. non-auth screens
- ✅ Get `isAuthenticated` from AuthContext instead of local state

### **Fix 4: Update LoginScreen**

Update: `mobile-app/src/screens/auth/LoginScreen.js`

```javascript
import { useAuth } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { setIsAuthenticated } = useAuth(); // Get setter from context
  // ... existing state ...

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/accounts/auth/login/', {
        method: 'POST',
        body: { username: username.trim(), password },
      });
      const data = await res.json();
      if (!res.ok || !data?.tokens?.access) {
        throw new Error(data?.detail || 'Login failed.');
      }
      await setDemoMode(false);
      await setTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
      
      // 🔑 Notify the AuthContext that auth succeeded
      setIsAuthenticated(true);
      
      // Navigation will automatically switch because isAuthenticated changed
      // No need to manually navigate
    } catch (e) {
      setError(e.message || 'Could not log in.');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
};
```

### **Fix 5: Update RegisterScreen**

Update: `mobile-app/src/screens/auth/RegisterScreen.js`

```javascript
import { useAuth } from '../../context/AuthContext';

const RegisterScreen = ({ navigation }) => {
  const { setIsAuthenticated } = useAuth(); // Get setter from context
  // ... existing state ...

  const submit = async () => {
    // ... validation ...

    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/accounts/auth/register/', {
        method: 'POST',
        body: { username: username.trim(), password },
      });
      const data = await res.json();
      if (!res.ok || !data?.tokens?.access) {
        throw new Error(data?.detail || 'Registration failed.');
      }
      await setDemoMode(false);
      await setTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
      
      // 🔑 Notify the AuthContext that auth succeeded
      setIsAuthenticated(true);
      
      // Navigation will automatically switch because isAuthenticated changed
    } catch (e) {
      setError(e.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
};
```

### **Fix 6: Update ProfileScreen Logout**

Update: `mobile-app/src/screens/main/ProfileScreen.js`

```javascript
import { useAuth } from '../../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { setIsAuthenticated } = useAuth();
  // ... existing code ...

  const logout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await clearTokens();
          await setDemoMode(false);
          
          // 🔑 Notify AuthContext that auth failed
          setIsAuthenticated(false);
          
          // Navigation will automatically switch to Login stack
        },
      },
    ]);
  };

  // ... rest of component
};
```

---

## Why This Fix Works

| Problem | Solution | Benefit |
|---------|----------|---------|
| Race condition in `onStateChange` | Remove it entirely | No unexpected re-evaluations |
| Auth state mismatch between screens | AuthContext is single source of truth | Consistent auth state everywhere |
| Providers re-mounting on nav changes | Providers only re-mount when `isAuthenticated` actually changes | Stable context data during tab navigation |
| No signal from Login to Navigator | `setIsAuthenticated()` call explicitly updates parent | Clear, predictable state flow |
| Navigation stack fragility | Conditional Stack.Groups with auth check | Clean auth/non-auth screen separation |

---

## Testing Checklist

After implementing the fix:

- [ ] User registers → redirects to Home (no lock)
- [ ] Tap Friends tab → switches successfully
- [ ] Tap Map tab → switches successfully
- [ ] Tap Alerts tab → switches successfully
- [ ] Tap Profile tab → switches successfully
- [ ] Tap Home tab again → switches successfully
- [ ] Navigate to FriendDetail from Friends → opens detail view
- [ ] Go back from FriendDetail → returns to Friends tab (not Home)
- [ ] Logout from Profile → redirects to Login (not locked)
- [ ] Login again → redirects to Home (no lock)
- [ ] Token refresh works → FriendLocationsContext still has data after refresh
- [ ] Notifications display correctly during tab navigation

---

## References

### Backend Logs
- **Service URL:** https://uvah.onrender.com
- **Service ID:** srv-d9tle6u417fc73en50r0
- **Region:** Oregon (US West)
- **Root Directory:** backend-api
- **All endpoints responding with 200/201 status codes** ✅

### Related Files

1. [AppNavigator.js](mobile-app/src/navigation/AppNavigator.js) - Main navigator with problematic `onStateChange`
2. [LoginScreen.js](mobile-app/src/screens/auth/LoginScreen.js) - Login handler
3. [RegisterScreen.js](mobile-app/src/screens/auth/RegisterScreen.js) - Register handler
4. [ProfileScreen.js](mobile-app/src/screens/main/ProfileScreen.js) - Contains logout logic
5. [FriendLocationsContext.js](mobile-app/src/context/FriendLocationsContext.js) - Context provider that breaks on re-mount
6. [NotificationsContext.js](mobile-app/src/context/NotificationsContext.js) - Another context provider that breaks on re-mount

### API Endpoints Verified Working
- `POST /api/accounts/auth/register/` → 201 Created
- `POST /api/accounts/auth/login/` → 200 OK (logs not shown but inferred working)
- `POST /api/accounts/auth/refresh/` → 200 OK
- `GET /api/accounts/profile/me/` → 200 OK
- `GET /api/social/location/friends/` → 200 OK
- `GET /api/social/notifications/` → 200 OK
- `GET /api/alerts/my-alerts/` → 200 OK
- `POST /api/social/location/update/` → 200 OK

---

## Implementation Priority

**Phase 1 (Critical):**
1. Create AuthContext.js
2. Update AppNavigator.js (remove onStateChange)
3. Update LoginScreen.js
4. Update RegisterScreen.js

**Phase 2 (Important):**
5. Update ProfileScreen.js logout
6. Test all navigation flows

**Phase 3 (Optional):**
7. Add auth state persistence to localStorage/AsyncStorage
8. Add auth state logging for debugging

---

## Timeline

- **Diagnosis:** 2026-08-17
- **Recommended Fix:** Implement 6 changes across 5 files
- **Estimated Dev Time:** 1-2 hours
- **Testing Time:** 30 minutes
- **Total Timeline:** 2-3 hours to full resolution

---

**Document Version:** 1.0  
**Last Updated:** 2026-08-17 08:00 UTC
