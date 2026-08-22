import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { apiFetch, isDemoMode } from '../api/client';

const EMERGENCY_CHANNEL_ID = 'uvah-emergency-v1';
const UPDATES_CHANNEL_ID = 'uvah-updates-v1';
const DEVICE_ID_KEY = 'uvah_push_device_id';
const PUSH_TOKEN_KEY = 'uvah_push_token';
const DELIVERED_NOTIFICATION_IDS_KEY = 'uvah_delivered_notification_ids';
const MAX_REMEMBERED_NOTIFICATION_IDS = 250;

const asStringData = (payload = {}) => Object.entries(payload).reduce((data, [key, value]) => {
  if (value !== undefined && value !== null) data[key] = String(value);
  return data;
}, {});

const getOrCreateDeviceId = async () => {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const created = `uvah-${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  return created;
};

export async function ensureNotificationChannels() {
  await notifee.createChannel({
    id: EMERGENCY_CHANNEL_ID,
    name: 'Emergency SOS alerts',
    description: 'Urgent SOS alerts from your trusted circle.',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    lights: true,
    lightColor: '#ff3147',
    visibility: AndroidVisibility.PUBLIC,
  });

  await notifee.createChannel({
    id: UPDATES_CHANNEL_ID,
    name: 'Uvah updates',
    description: 'Friend requests, check-ins, and account updates.',
    importance: AndroidImportance.DEFAULT,
    sound: 'default',
    vibration: true,
    visibility: AndroidVisibility.PRIVATE,
  });
}

export async function requestNotificationPermission() {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;
}

export async function loadDeliveredNotificationIds() {
  try {
    const raw = await AsyncStorage.getItem(DELIVERED_NOTIFICATION_IDS_KEY);
    const values = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(values) ? values.map(String) : []);
  } catch (_) {
    return new Set();
  }
}

export async function rememberDeliveredNotificationIds(ids = []) {
  const normalized = ids.filter((id) => id !== undefined && id !== null).map(String);
  if (!normalized.length) return;

  const existing = await loadDeliveredNotificationIds();
  normalized.forEach((id) => existing.add(id));
  const trimmed = Array.from(existing).slice(-MAX_REMEMBERED_NOTIFICATION_IDS);
  await AsyncStorage.setItem(DELIVERED_NOTIFICATION_IDS_KEY, JSON.stringify(trimmed));
}

export async function displayNotification(title, body, opts = {}) {
  await ensureNotificationChannels();
  const isEmergency = opts.type === 'sos_alert';
  const data = asStringData({
    ...(opts.payload || {}),
    notification_type: opts.type,
    notification_id: opts.notificationId,
  });

  await notifee.displayNotification({
    id: opts.notificationId ? `uvah-${opts.notificationId}` : undefined,
    title: title || (isEmergency ? 'SOS Alert' : 'Uvah'),
    body: body || '',
    data,
    android: {
      channelId: isEmergency ? EMERGENCY_CHANNEL_ID : UPDATES_CHANNEL_ID,
      smallIcon: 'ic_launcher',
      color: isEmergency ? '#ff3147' : '#2aa8f2',
      category: isEmergency ? AndroidCategory.ALARM : AndroidCategory.SOCIAL,
      visibility: isEmergency ? AndroidVisibility.PUBLIC : AndroidVisibility.PRIVATE,
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: isEmergency
        ? [{ title: 'View SOS', pressAction: { id: 'view_sos', launchActivity: 'default' } }]
        : undefined,
      autoCancel: true,
      ongoing: false,
      showTimestamp: true,
      timestamp: Date.now(),
    },
  });

  if (opts.notificationId) await rememberDeliveredNotificationIds([opts.notificationId]);
}

const registerTokenWithBackend = async (token) => {
  if (!token || await isDemoMode()) return null;
  const deviceId = await getOrCreateDeviceId();
  const response = await apiFetch('/api/social/push-tokens/register/', {
    method: 'POST',
    body: {
      token,
      device_id: deviceId,
      platform: Platform.OS,
    },
  });
  if (!response.ok) throw new Error(`Push-token registration failed (${response.status}).`);
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  return token;
};

export async function registerDeviceForPush() {
  if (await isDemoMode()) return null;
  await ensureNotificationChannels();
  if (!(await requestNotificationPermission())) return null;

  await messaging().registerDeviceForRemoteMessages();
  const token = await messaging().getToken();
  return registerTokenWithBackend(token);
}

export async function unregisterDeviceFromPush() {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (token && !(await isDemoMode())) {
      await apiFetch('/api/social/push-tokens/unregister/', {
        method: 'POST',
        body: { token },
      });
    }
    await messaging().deleteToken();
  } finally {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  }
}

const remoteMessageData = (remoteMessage) => asStringData({
  ...(remoteMessage?.data || {}),
  title: remoteMessage?.notification?.title || remoteMessage?.data?.title,
  message: remoteMessage?.notification?.body || remoteMessage?.data?.message,
});

export function subscribeToPushEvents({ onReceive, onPress } = {}) {
  let active = true;

  const receiveUnsubscribe = messaging().onMessage(async (remoteMessage) => {
    const data = remoteMessageData(remoteMessage);
    if (data.notification_id) await rememberDeliveredNotificationIds([data.notification_id]);
    await displayNotification(data.title, data.message, {
      type: data.notification_type,
      notificationId: data.notification_id,
      payload: data,
    });
    if (active) await onReceive?.(data);
  });

  const openedUnsubscribe = messaging().onNotificationOpenedApp(async (remoteMessage) => {
    const data = remoteMessageData(remoteMessage);
    if (data.notification_id) await rememberDeliveredNotificationIds([data.notification_id]);
    if (active) await onPress?.(data);
  });

  const tokenUnsubscribe = messaging().onTokenRefresh((token) => {
    registerTokenWithBackend(token).catch(() => {});
  });

  const notifeeUnsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type !== EventType.PRESS && type !== EventType.ACTION_PRESS) return;
    const data = asStringData(detail.notification?.data || {});
    if (data.notification_id) await rememberDeliveredNotificationIds([data.notification_id]);
    if (active) await onPress?.(data);
  });

  messaging().getInitialNotification().then(async (remoteMessage) => {
    if (!active || !remoteMessage) return;
    const data = remoteMessageData(remoteMessage);
    if (data.notification_id) await rememberDeliveredNotificationIds([data.notification_id]);
    await onPress?.(data);
  }).catch(() => {});

  notifee.getInitialNotification().then(async (initialNotification) => {
    if (!active || !initialNotification?.notification) return;
    const data = asStringData(initialNotification.notification.data || {});
    if (data.notification_id) await rememberDeliveredNotificationIds([data.notification_id]);
    await onPress?.(data);
  }).catch(() => {});

  return () => {
    active = false;
    receiveUnsubscribe();
    openedUnsubscribe();
    tokenUnsubscribe();
    notifeeUnsubscribe();
  };
}

export async function handleBackgroundRemoteMessage(remoteMessage) {
  const notificationId = remoteMessage?.data?.notification_id;
  if (notificationId) await rememberDeliveredNotificationIds([notificationId]);
}
