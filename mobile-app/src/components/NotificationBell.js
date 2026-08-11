import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNotifications } from '../context/NotificationsContext';
import { palette, radius } from '../theme/tokens';

const NotificationBell = () => {
  const { enabled, unreadCount, openPanel } = useNotifications();

  if (!enabled) return null;

  return (
    <TouchableOpacity style={styles.btn} onPress={openPanel} accessibilityLabel="Open notifications">
      <Icon name="notifications-outline" size={22} color={palette.text} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    padding: 8,
    borderRadius: radius.full,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ff3147',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default NotificationBell;
