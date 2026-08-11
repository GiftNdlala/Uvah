import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';
import { reset } from '../utils/navigationRef';

const BASE_URL = ENV.BASE_URL;
const ACCESS_TOKEN_KEY = 'uvah_access_token';
const REFRESH_TOKEN_KEY = 'uvah_refresh_token';
const DEMO_MODE_KEY = 'uvah_demo_mode';

const demoState = {
  profile: {
    id: 1,
    username: 'guest_demo',
    first_name: 'Guest',
    last_name: 'Demo',
    email: 'guest@uvah.demo',
    emergency_contact: 'Demo Guardian',
    emergency_contact_phone: '+27 82 000 0000',
  },
  alerts: [
    {
      id: 1201,
      severity_level: 2,
      trigger_count: 2,
      trigger_source: 'app',
      message: 'Emergency SOS activated',
      status: 'active',
      live_view_token: 'demo-live-token-1201',
      share_url: 'http://demo.uvah/live/demo-live-token-1201',
      latest_location: {
        lat: -26.2041,
        lon: 28.0473,
        accuracy: 20,
        captured_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    },
    {
      id: 1200,
      severity_level: 1,
      trigger_count: 1,
      trigger_source: 'checkin',
      message: 'Arrival check-in',
      status: 'resolved',
      live_view_token: 'demo-live-token-1200',
      share_url: 'http://demo.uvah/live/demo-live-token-1200',
      latest_location: {
        lat: -26.2011,
        lon: 28.0447,
        accuracy: 22,
        captured_at: new Date().toISOString(),
      },
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
  ],
  nextAlertId: 1300,
  friendDirectory: [
    { id: 11, username: 'thabo_m' },
    { id: 12, username: 'nomsa_k' },
    { id: 13, username: 'sipho_d' },
    { id: 14, username: 'lerato_n' },
    { id: 15, username: 'kamo_p' },
  ],
  friendsLocations: [
    { user: { id: 11, username: 'thabo_m' }, lat: -26.203, lon: 28.046, accuracy: 18, updated_at: new Date().toISOString(), is_sharing: true },
    { user: { id: 12, username: 'nomsa_k' }, lat: -26.207, lon: 28.041, accuracy: 24, updated_at: new Date().toISOString(), is_sharing: true },
    { user: { id: 13, username: 'sipho_d' }, lat: -26.201, lon: 28.05, accuracy: 21, updated_at: new Date().toISOString(), is_sharing: false },
  ],
  friendships: [],
  incomingRequests: [],
  notifications: [],
};

const jsonResponse = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const clone = (data) => JSON.parse(JSON.stringify(data));

const buildDemoAlert = ({ severity_level, trigger_count, trigger_source, message }) => {
  const id = demoState.nextAlertId++;
  const token = `demo-live-token-${id}`;
  return {
    id,
    severity_level: severity_level ?? 1,
    trigger_count: trigger_count ?? 1,
    trigger_source: trigger_source || 'app',
    message: message || 'Demo alert',
    status: 'active',
    live_view_token: token,
    share_url: `http://demo.uvah/live/${token}`,
    latest_location: null,
    created_at: new Date().toISOString(),
  };
};

const updateDemoAlertLocation = (alert, body = {}) => {
  alert.latest_location = {
    lat: Number(body.lat),
    lon: Number(body.lon),
    accuracy: body.accuracy != null ? Number(body.accuracy) : null,
    captured_at: new Date().toISOString(),
  };
};

const handleDemoApiFetch = (path, { method = 'GET', body } = {}) => {
  const [pathname, queryString = ''] = path.split('?');
  const params = new URLSearchParams(queryString);
  const requestMethod = method.toUpperCase();

  if (pathname === '/api/accounts/profile/me/' && requestMethod === 'GET') {
    return jsonResponse(clone(demoState.profile));
  }

  if (pathname === '/api/accounts/profile/me/' && (requestMethod === 'PATCH' || requestMethod === 'PUT')) {
    demoState.profile = { ...demoState.profile, ...body };
    return jsonResponse(clone(demoState.profile));
  }

  if (pathname === '/api/alerts' && requestMethod === 'POST') {
    const alert = buildDemoAlert(body || {});
    demoState.alerts.unshift(alert);
    return jsonResponse(clone(alert), 201);
  }

  if (pathname === '/api/alerts/my-alerts/' && requestMethod === 'GET') {
    const status = params.get('status');
    const alerts = status ? demoState.alerts.filter((item) => item.status === status) : demoState.alerts;
    return jsonResponse(clone(alerts));
  }

  const cancelMatch = pathname.match(/^\/api\/alerts\/(\d+)\/cancel\/$/);
  if (cancelMatch && requestMethod === 'POST') {
    const alertId = Number(cancelMatch[1]);
    const alert = demoState.alerts.find((item) => item.id === alertId);
    if (!alert) return jsonResponse({ detail: 'Not found' }, 404);
    alert.status = 'canceled';
    return jsonResponse(clone(alert));
  }

  const locationMatch = pathname.match(/^\/api\/alerts\/(\d+)\/locations$/);
  if (locationMatch && requestMethod === 'POST') {
    const alertId = Number(locationMatch[1]);
    const alert = demoState.alerts.find((item) => item.id === alertId);
    if (!alert) return jsonResponse({ detail: 'Not found' }, 404);
    if (alert.status !== 'active') return jsonResponse({ detail: 'Cannot post location to a non-active alert' }, 400);
    updateDemoAlertLocation(alert, body || {});
    return jsonResponse({ ok: true }, 201);
  }

  const alertDetailMatch = pathname.match(/^\/api\/alerts\/(\d+)$/);
  if (alertDetailMatch && requestMethod === 'GET') {
    const alertId = Number(alertDetailMatch[1]);
    const alert = demoState.alerts.find((item) => item.id === alertId);
    if (!alert) return jsonResponse({ detail: 'Not found' }, 404);
    return jsonResponse(clone(alert));
  }

  if (pathname === '/api/social/location/friends/' && requestMethod === 'GET') {
    const visible = demoState.friendsLocations.filter((item) => item.is_sharing);
    return jsonResponse(clone(visible));
  }

  if (pathname === '/api/social/live-share/toggle/' && requestMethod === 'POST') {
    const viewerUsername = body?.viewer_username;
    const isActive = Boolean(body?.is_active);
    const friend = demoState.friendsLocations.find((item) => item.user.username === viewerUsername);
    if (!friend) return jsonResponse({ detail: 'User not found' }, 404);
    friend.is_sharing = isActive;
    friend.updated_at = new Date().toISOString();
    return jsonResponse({
      id: friend.user.id,
      owner: { id: demoState.profile.id, username: demoState.profile.username },
      viewer: { id: friend.user.id, username: friend.user.username },
      is_active: isActive,
      created_at: new Date().toISOString(),
    });
  }

  if (pathname === '/api/social/location/update/' && requestMethod === 'POST') {
    return jsonResponse({ ok: true });
  }

  if (pathname === '/api/social/users/search/' && requestMethod === 'GET') {
    const q = (params.get('q') || '').trim().toLowerCase();
    if (!q) return jsonResponse([]);
    const results = demoState.friendDirectory.filter((item) => item.username.toLowerCase().includes(q));
    return jsonResponse(clone(results.slice(0, 20)));
  }

  if (pathname === '/api/social/friends/' && requestMethod === 'GET') {
    const list = demoState.friendships.map((item) => ({
      ...item,
      is_sharing_with_friend: true,
      is_sharing_with_me: item.friend?.username !== 'sipho_d',
      location_label: item.friend?.username === 'sipho_d' ? 'Location hidden' : 'You are sharing your location',
      last_location: demoState.friendsLocations.find((loc) => loc.user.id === item.friend.id) || null,
    }));
    return jsonResponse(clone(list));
  }

  if (pathname === '/api/social/friends/requests/incoming/' && requestMethod === 'GET') {
    return jsonResponse(clone(demoState.incomingRequests));
  }

  if (pathname === '/api/social/notifications/' && requestMethod === 'GET') {
    return jsonResponse(clone(demoState.notifications));
  }

  const notifReadMatch = pathname.match(/^\/api\/social\/notifications\/(\d+)\/read\/$/);
  if (notifReadMatch && requestMethod === 'POST') {
    const notifId = Number(notifReadMatch[1]);
    const notif = demoState.notifications.find((item) => item.id === notifId);
    if (notif) notif.is_read = true;
    return jsonResponse({ ok: true });
  }

  if (pathname === '/api/social/friends/requests/send/' && requestMethod === 'POST') {
    const toUsername = body?.to_username;
    if (!toUsername) return jsonResponse({ detail: 'to_username is required' }, 400);
    const requestPayload = {
      id: Date.now(),
      from_user: { id: demoState.profile.id, username: demoState.profile.username },
      to_user: { id: 99, username: toUsername },
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    demoState.incomingRequests.push(requestPayload);
    demoState.notifications.push({
      id: Date.now() + 1,
      notification_type: 'friend_request',
      title: 'New Friend Request',
      message: `@${demoState.profile.username} sent you a friend request.`,
      is_read: false,
      related_entity_id: requestPayload.id,
      created_at: new Date().toISOString(),
    });
    return jsonResponse(clone(requestPayload), 201);
  }

  if (pathname.match(/^\/api\/social\/friends\/requests\/\d+\/respond\/$/) && requestMethod === 'POST') {
    const requestId = Number(pathname.match(/^\/api\/social\/friends\/requests\/(\d+)\/respond\/$/)[1]);
    const action = body?.action;
    const idx = demoState.incomingRequests.findIndex((item) => item.id === requestId);
    if (idx >= 0) {
      const req = demoState.incomingRequests[idx];
      if (action === 'accept') {
        demoState.friendships.push({
          id: Date.now(),
          friend: req.from_user,
          created_at: new Date().toISOString(),
        });
      }
      demoState.incomingRequests.splice(idx, 1);
    }
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ detail: `Demo route not mocked: ${requestMethod} ${pathname}` }, 404);
};

export async function setTokens({ access, refresh }) {
  if (access) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  await setDemoMode(false);
}

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function clearTokens() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function setDemoMode(enabled) {
  if (enabled) {
    await AsyncStorage.setItem(DEMO_MODE_KEY, '1');
  } else {
    await AsyncStorage.removeItem(DEMO_MODE_KEY);
  }
}

export async function isDemoMode() {
  const value = await AsyncStorage.getItem(DEMO_MODE_KEY);
  return value === '1';
}

export async function apiFetch(path, { method = 'GET', headers = {}, body } = {}) {
  if (await isDemoMode()) {
    return handleDemoApiFetch(path, { method, body });
  }

  let token = await getAccessToken();
  const getHeaders = (t) => ({
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
    ...headers,
  });

  let res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getHeaders(token),
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle auto-refresh on 401
  if (res.status === 401) {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/api/accounts/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          await setTokens({ access: data.access, refresh: data.refresh || refreshToken });
          token = data.access; // Use new token for retry
          
          // Retry original request
          res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers: getHeaders(token),
            body: body ? JSON.stringify(body) : undefined,
          });
          return res;
        }
      } catch (e) {
        // Fallthrough to logout
      }
    }
    
    // If refresh failed or missing, logout
    await clearTokens();
    reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  return res;
}

export async function apiUpload(path, formData) {
  if (await isDemoMode()) {
    return jsonResponse({ detail: 'Avatar upload not available in demo mode' }, 400);
  }

  let token = await getAccessToken();
  let res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (res.status === 401) {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/api/accounts/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          await setTokens({ access: data.access, refresh: data.refresh || refreshToken });
          token = data.access;
          res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: formData,
          });
        }
      } catch (_) {}
    }
  }

  return res;
}

export { BASE_URL };
