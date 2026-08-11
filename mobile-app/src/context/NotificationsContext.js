import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api/client';
import { parseApiListResponse } from '../utils/apiData';
import { displayNotification, requestNotificationPermission } from '../services/notificationService';

const NotificationsContext = createContext(null);

export const NotificationsProvider = ({ enabled, children }) => {
  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const previousUnread = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setNotifications([]);
      return [];
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/social/notifications/');
      const list = await parseApiListResponse(res);
      setNotifications(list);
      return list;
    } catch (_) {
      setNotifications([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    refresh();
    const id = setInterval(async () => {
      const list = await refresh();
      const unread = list.filter((n) => !n.is_read).length;
      if (unread > previousUnread.current) {
        const latest = list.find((n) => !n.is_read);
        if (latest) {
          displayNotification(latest.title, latest.message);
        }
      }
      previousUnread.current = unread;
    }, 12000);

    return () => clearInterval(id);
  }, [enabled, refresh]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const markRead = useCallback(
    async (id) => {
      try {
        await apiFetch(`/api/social/notifications/${id}/read/`, { method: 'POST' });
      } catch (_) {}
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({
      enabled,
      notifications,
      unreadCount,
      loading,
      panelOpen,
      openPanel: () => setPanelOpen(true),
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
