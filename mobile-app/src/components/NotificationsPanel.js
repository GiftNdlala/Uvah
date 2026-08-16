import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationsContext';
import { apiFetch } from '../api/client';
import { palette, radius, typography } from '../theme/tokens';

const typeMeta = {
  friend_request: { icon: 'person-add', color: '#2aa8f2', label: 'Friend request' },
  friend_accept: { icon: 'people', color: '#3ecf8e', label: 'Friend' },
  sos_alert: { icon: 'warning', color: '#ff3147', label: 'SOS' },
  checkin: { icon: 'checkmark-circle', color: '#f5a623', label: 'Check-in' },
  system: { icon: 'information-circle', color: '#8eb6d9', label: 'System' },
};

const NotificationsPanel = () => {
  const navigation = useNavigation();
  const { notifications, unreadCount, loading, panelOpen, closePanel, markRead, refresh } = useNotifications();

  const respondInvite = async (requestId, action) => {
    try {
      const res = await apiFetch(`/api/social/friends/requests/${requestId}/respond/`, {
        method: 'POST',
        body: { action },
      });
      if (!res.ok) throw new Error('Failed');
      await refresh();
    } catch (_) {}
  };

  const onPressItem = async (item) => {
    if (item.notification_type === 'sos_alert') {
      try {
        const response = await apiFetch(`/api/alerts/${item.related_entity_id}`);
        if (!response.ok) throw new Error('Unable to load SOS alert.');
        const alert = await response.json();
        if (!alert.share_url) throw new Error('Live location is unavailable.');
        await Linking.openURL(alert.share_url);
      } catch (_) {
        Alert.alert('SOS unavailable', 'This SOS location is no longer available.');
      }
      closePanel();
      await markRead(item.id);
      return;
    }
    if (item.notification_type === 'checkin') {
      closePanel();
      navigation.navigate('Alerts');
      await markRead(item.id);
      return;
    }
    if (item.notification_type !== 'friend_request') {
      await markRead(item.id);
    }
  };

  return (
    <Modal visible={panelOpen} animationType="slide" transparent onRequestClose={closePanel}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Notifications</Text>
              <Text style={styles.subtitle}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
              </Text>
            </View>
            <TouchableOpacity onPress={closePanel} style={styles.closeBtn} accessibilityLabel="Close">
              <Icon name="close" size={22} color={palette.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={palette.accent} />
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Icon name="notifications-off-outline" size={32} color={palette.textMuted} />
                  <Text style={styles.emptyTitle}>No notifications yet</Text>
                  <Text style={styles.emptyText}>SOS alerts, check-ins, and friend requests will appear here.</Text>
                </View>
              ) : (
                notifications.map((item) => {
                  const meta = typeMeta[item.notification_type] || typeMeta.system;
                  return (
                    <TouchableOpacity
                      key={String(item.id)}
                      style={[styles.card, !item.is_read && styles.cardUnread]}
                      onPress={() => onPressItem(item)}
                      activeOpacity={0.85}
                    >
                      <View style={[styles.iconWrap, { backgroundColor: `${meta.color}22` }]}>
                        <Icon name={meta.icon} size={20} color={meta.color} />
                      </View>
                      <View style={styles.cardBody}>
                        <View style={styles.cardTop}>
                          <Text style={styles.cardLabel}>{meta.label}</Text>
                          <Text style={styles.cardTime}>
                            {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                          </Text>
                        </View>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.cardMessage}>{item.message}</Text>

                        {item.notification_type === 'friend_request' ? (
                          <View style={styles.actions}>
                            <TouchableOpacity
                              style={styles.acceptBtn}
                              onPress={() => {
                                respondInvite(item.related_entity_id, 'accept');
                                markRead(item.id);
                              }}
                            >
                              <Text style={styles.actionText}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.declineBtn}
                              onPress={() => {
                                respondInvite(item.related_entity_id, 'reject');
                                markRead(item.id);
                              }}
                            >
                              <Text style={styles.actionText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity style={styles.dismissBtn} onPress={() => markRead(item.id)}>
                            <Text style={styles.dismissText}>Mark as read</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: palette.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderColor: palette.border,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4a6278',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  title: {
    color: palette.text,
    fontSize: 24,
    fontFamily: typography.heading,
  },
  subtitle: {
    color: palette.textMuted,
    marginTop: 2,
    fontSize: 13,
  },
  closeBtn: {
    padding: 8,
    borderRadius: radius.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  emptyTitle: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 18,
    marginTop: 12,
  },
  emptyText: {
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 12,
  },
  cardUnread: {
    borderColor: '#2aa8f2',
    backgroundColor: '#13283f',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardLabel: {
    color: palette.info,
    fontSize: 11,
    fontFamily: typography.heading,
    textTransform: 'uppercase',
  },
  cardTime: {
    color: palette.textMuted,
    fontSize: 10,
    flexShrink: 1,
  },
  cardTitle: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 16,
    marginTop: 4,
  },
  cardMessage: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  acceptBtn: {
    backgroundColor: '#1f4a37',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  declineBtn: {
    backgroundColor: '#5a2f36',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionText: {
    color: palette.text,
    fontSize: 12,
    fontFamily: typography.heading,
  },
  dismissBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#1b3f56',
  },
  dismissText: {
    color: palette.info,
    fontSize: 12,
  },
});

export default NotificationsPanel;
