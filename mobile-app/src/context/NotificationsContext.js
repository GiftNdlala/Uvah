import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { apiFetch } from '../api/client';
import { parseApiListResponse } from '../utils/apiData';
import { navigate } from '../utils/navigationRef';
import {
  displayNotification,
  loadDeliveredNotificationIds,
  registerDeviceForPush,
  rememberDeliveredNotificationIds,
  subscribeToPushEvents,
} from '../services/notificationService';

const NotificationsContext = createContext(null);
const POLL_INTERVAL_MS = 12000;
const MAX_LOCAL_ALERTS_PER_POLL = 5;

export const NotificationsProvider = ({ enabled, children }) => {
  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const notificationsRef = useRef([]);
  const refreshPromiseRef = useRef(null);
  const pollInitializedRef = useRef(false);

  const updateNotifications = useCallback((list) => {
    notificationsRef.current = list;
    setNotifications(list);
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) {
      updateNotifications([]);
      return [];
    }
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    setLoading(true);
    refreshPromiseRef.current = (async () => {
      const res = await apiFetch('/api/social/notifications/');
      if (!res.ok) throw new Error(`Notification refresh failed (${res.status}).`);
      const list = await parseApiListResponse(res);
      updateNotifications(list);
      return list;
    })();

    try {
      return await refreshPromiseRef.current;
    } catch (_) {
      // A temporary network failure must not erase the last known notification list.
      return notificationsRef.current;
    } finally {
      refreshPromiseRef.current = null;
      setLoading(false);
    }
  }, [enabled, updateNotifications]);

  const markRead = useCallback(async (id) => {
    if (!id) return;
    updateNotifications(notificationsRef.current.map((item) => (
      String(item.id) === String(id) ? { ...item, is_read: true } : item
    )));
    try {
      const response = await apiFetch(`/api/social/notifications/${id}/read/`, { method: 'POST' });
      if (!response.ok) throw new Error('Unable to mark notification read.');
    } catch (_) {
      await refresh();
    }
  }, [refresh, updateNotifications]);

  const handleNotificationPress = useCallback(async (data = {}) => {
    const notificationId = data.notification_id || data.id;
    if (notificationId) await markRead(notificationId);

    if (data.notification_type === 'sos_alert' && data.related_entity_id) {
      try {
        const response = await apiFetch(`/api/alerts/${data.related_entity_id}`);
        if (!response.ok) throw new Error('SOS is unavailable.');
        const alert = await response.json();
        navigate('AlertDetail', { alert });
      } catch (_) {
        navigate('MainApp', { screen: 'Alerts' });
      }
      return;
    }

    if (data.notification_type === 'checkin') {
      navigate('MainApp', { screen: 'Alerts' });
      return;
    }

    if (data.notification_type === 'friend_request') {
      setPanelOpen(true);
    }
  }, [markRead]);

  const processNewNotifications = useCallback(async (list) => {
    const deliveredIds = await loadDeliveredNotificationIds();
    const listIds = list.map((item) => String(item.id));

    if (!pollInitializedRef.current) {
      pollInitializedRef.current = true;
      // On first-ever setup, establish a baseline instead of alarming for old history.
      if (deliveredIds.size === 0) {
        await rememberDeliveredNotificationIds(listIds);
        return;
      }
    }

    const unseen = list
      .filter((item) => !item.is_read && !deliveredIds.has(String(item.id)))
      .sort((a, b) => {
        if (a.notification_type === 'sos_alert' && b.notification_type !== 'sos_alert') return -1;
        if (b.notification_type === 'sos_alert' && a.notification_type !== 'sos_alert') return 1;
        return Number(b.id) - Number(a.id);
      });

    const localFallbacks = unseen
      .filter((item) => !item.push_delivered_at)
      .slice(0, MAX_LOCAL_ALERTS_PER_POLL);

    for (const item of localFallbacks) {
      await displayNotification(item.title, item.message, {
        type: item.notification_type,
        notificationId: item.id,
        payload: {
          related_entity_id: item.related_entity_id,
          created_at: item.created_at,
        },
      });
    }

    await rememberDeliveredNotificationIds(listIds);
  }, []);

  useEffect(() => {
    if (!enabled) {
      updateNotifications([]);
      pollInitializedRef.current = false;
      return undefined;
    }

    let active = true;
    let timer = null;

    const poll = async () => {
      const list = await refresh();
      if (active) await processNewNotifications(list);
    };

    const scheduleNextPoll = () => {
      timer = setTimeout(async () => {
        await poll();
        if (active) scheduleNextPoll();
      }, POLL_INTERVAL_MS);
    };

    const pushUnsubscribe = subscribeToPushEvents({
      onReceive: refresh,
      onPress: handleNotificationPress,
    });

    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      poll().catch(() => {});
      registerDeviceForPush().catch(() => {});
    });

    registerDeviceForPush().catch(() => {});
    poll().finally(() => {
      if (active) scheduleNextPoll();
    });

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      appStateSubscription.remove();
      pushUnsubscribe();
    };
  }, [enabled, handleNotificationPress, processNewNotifications, refresh, updateNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      enabled,
      notifications,
      unreadCount,
      loading,
      panelOpen,
      openPanel: () => {
        setPanelOpen(true);
        refresh();
      },
      closePanel: () => setPanelOpen(false),
      refresh,
      markRead,
    }),
    [enabled, notifications, unreadCount, loading, panelOpen, refresh, markRead],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      enabled: false,
      notifications: [],
      unreadCount: 0,
      loading: false,
      panelOpen: false,
      openPanel: () => {},
      closePanel: () => {},
      refresh: async () => [],
      markRead: async () => {},
    };
  }
  return ctx;
};
