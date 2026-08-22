import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenShell from '../../components/ScreenShell';
import { apiFetch } from '../../api/client';
import { parseApiList, parseApiListResponse } from '../../utils/apiData';
import { useNotifications } from '../../context/NotificationsContext';
import { fetchAndSyncUserLocation } from '../../utils/location';
import { palette, radius, typography } from '../../theme/tokens';



const ContactsScreen = ({ navigation }) => {
  const { refresh: refreshNotifications } = useNotifications();
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const [friendsRes, incomingRes] = await Promise.all([
        apiFetch('/api/social/friends/'),
        apiFetch('/api/social/friends/requests/incoming/'),
      ]);
      setFriends(await parseApiListResponse(friendsRes));
      setIncoming(await parseApiListResponse(incomingRes));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const searchUsers = async () => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await apiFetch(`/api/social/users/search/?q=${encodeURIComponent(query.trim())}`);
      const data = res.ok ? await res.json() : [];
      setSearchResults(parseApiList(data));
    } catch (_) {
      setSearchResults([]);
    }
  };

  const sendInvite = async (username) => {
    try {
      const res = await apiFetch('/api/social/friends/requests/send/', {
        method: 'POST',
        body: { to_username: username },
      });
      if (res.status === 409) {
        Alert.alert('Already sent', `A pending invite already exists for @${username}.`);
        return;
      }
      if (!res.ok) throw new Error('Invite failed');
      Alert.alert('Sent', `Invite sent to @${username}`);
      load();
    } catch (_) {
      Alert.alert('Unable to invite', 'Please check your connection and try again.');
    }
  };

  const respondInvite = async (requestId, action) => {
    try {
      const res = await apiFetch(`/api/social/friends/requests/${requestId}/respond/`, {
        method: 'POST',
        body: { action },
      });
      if (!res.ok) throw new Error('Failed');
      await load();
      await refreshNotifications();
    } catch (_) {
      Alert.alert('Error', 'Unable to respond to the request right now.');
    }
  };

  const toggleShare = async (friendUsername, isActive) => {
    try {
      if (isActive) {
        await fetchAndSyncUserLocation(true);
      }
      const res = await apiFetch('/api/social/live-share/toggle/', {
        method: 'POST',
        body: { viewer_username: friendUsername, is_active: isActive },
      });
      if (!res.ok) throw new Error('Failed');
      await load();
      Alert.alert(
        'Updated',
        isActive
          ? 'Your last known location is now visible to this friend.'
          : 'Location sharing turned off for this friend.',
      );
    } catch (_) {
      Alert.alert('Share update failed', 'Failed to update live-share setting.');
    }
  };

  if (loading) {
    return (
      <ScreenShell includeBottomInset={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.accent} />
          <Text style={styles.loadingText}>Loading network</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell includeBottomInset={false}>
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Trusted Circle</Text>
        <Text style={styles.subtitle}>Find, invite, and control who sees your live location.</Text>
      </View>

      <View style={styles.searchCard}>
        <TextInput
          style={styles.input}
          placeholder="Search username"
          placeholderTextColor={palette.textMuted}
          value={query}
          onChangeText={(text) => {
            setQuery(text);
            if (!text.trim()) setSearchResults([]);
          }}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={searchUsers}>
          <Icon name="search" color={palette.text} size={16} />
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {searchResults.length > 0 ? (
        <View style={styles.resultsCard}>
          {searchResults.map((user) => (
            <View key={user.id} style={styles.resultRow}>
              <Text style={styles.resultText}>@{user.username}</Text>
              <TouchableOpacity style={styles.inviteBtn} onPress={() => sendInvite(user.username)}>
                <Text style={styles.inviteText}>Invite</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {incoming.length > 0 ? (
        <View style={styles.incomingCard}>
          <Text style={styles.incomingTitle}>Incoming requests</Text>
          {incoming.map((req) => (
            <View key={req.id} style={styles.resultRow}>
              <Text style={styles.resultText}>@{req.from_user?.username}</Text>
              <View style={styles.inlineButtons}>
                <TouchableOpacity style={styles.approveBtn} onPress={() => respondInvite(req.id, 'accept')}>
                  <Text style={styles.inlineBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => respondInvite(req.id, 'reject')}>
                  <Text style={styles.inlineBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <FlatList
        data={friends}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 18 }}
        renderItem={({ item }) => (
          <View style={styles.friendCard}>
            <View style={styles.friendTopRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.friendName}>@{item.friend?.username}</Text>
                <Text style={styles.friendMeta}>{item.location_label || 'Location hidden'}</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, item.is_sharing_with_friend ? styles.badgeGreen : styles.badgeGrey]}>
                    <Text style={styles.badgeText}>Sharing: {item.is_sharing_with_friend ? 'Active' : 'Off'}</Text>
                  </View>
                  <View style={[styles.badge, item.is_sharing_with_me ? styles.badgeBlue : styles.badgeGrey]}>
                    <Text style={styles.badgeText}>Receiving: {item.is_sharing_with_me ? 'Active' : 'Off'}</Text>
                  </View>
                </View>
              </View>
              <View
                style={[
                  styles.shareDot,
                  {
                    backgroundColor: item.is_sharing_with_friend
                      ? palette.success
                      : item.is_sharing_with_me
                        ? '#2aa8f2'
                        : '#41596b',
                  },
                ]}
              />
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('FriendDetail', { username: item.friend?.username })}>
                <Text style={styles.actionText}>Details</Text>
              </TouchableOpacity>

              {item.is_sharing_with_friend ? (
                <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={() => toggleShare(item.friend?.username, false)}>
                  <Text style={styles.actionText}>Stop Share</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.actionBtn, styles.actionSuccess]} onPress={() => toggleShare(item.friend?.username, true)}>
                  <Text style={styles.actionText}>Share Location</Text>
                </TouchableOpacity>
              )}

              {item.is_sharing_with_me && item.last_location ? (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionLocate]}
                  onPress={() => {
                    navigation.navigate('Map', {
                      focusedLocation: {
                        latitude: Number(item.last_location.lat),
                        longitude: Number(item.last_location.lon),
                      },
                    });
                  }}
                >
                  <Icon name="locate" size={14} color="#fff" />
                  <Text style={[styles.actionText, { marginLeft: 4 }]}>Locate</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: palette.text,
    marginTop: 8,
  },
  title: {
    color: palette.text,
    fontSize: 30,
    fontFamily: typography.display,
    marginTop: 16,
  },
  subtitle: {
    color: palette.textMuted,
    marginTop: 4,
  },
  headerBlock: {
    marginBottom: 12,
  },
  searchCard: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: palette.text,
    paddingHorizontal: 12,
  },
  searchBtn: {
    minWidth: 96,
    borderRadius: radius.md,
    backgroundColor: palette.accent,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  searchBtnText: {
    color: palette.text,
    fontFamily: typography.heading,
  },
  resultsCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 10,
    marginBottom: 10,
  },
  incomingCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 10,
    marginBottom: 10,
  },
  incomingTitle: {
    color: palette.text,
    fontFamily: typography.heading,
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  resultText: {
    color: palette.text,
  },
  inviteBtn: {
    borderRadius: radius.pill,
    backgroundColor: '#1b3f56',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inviteText: {
    color: palette.info,
    fontFamily: typography.heading,
    fontSize: 12,
  },
  inlineButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    backgroundColor: '#1f4a37',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  declineBtn: {
    backgroundColor: '#5a2f36',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  inlineBtnText: {
    color: palette.text,
    fontSize: 12,
  },
  friendCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 14,
    marginBottom: 10,
  },
  friendTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendName: {
    color: palette.text,
    fontSize: 18,
    fontFamily: typography.heading,
  },
  friendMeta: {
    color: palette.textMuted,
    marginTop: 2,
  },
  shareDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  cardActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#163047',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
  },
  actionDanger: {
    backgroundColor: '#4f2a31',
    borderColor: '#83444f',
  },
  actionSuccess: {
    backgroundColor: '#1f4a37',
    borderColor: '#3f7961',
  },
  actionLocate: {
    backgroundColor: '#1b4a6d',
    borderColor: '#2aa8f2',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  badgeGreen: {
    backgroundColor: 'rgba(47, 146, 118, 0.16)',
    borderColor: '#2f9276',
  },
  badgeBlue: {
    backgroundColor: 'rgba(42, 168, 242, 0.16)',
    borderColor: '#2aa8f2',
  },
  badgeGrey: {
    backgroundColor: '#1b293a',
    borderColor: palette.border,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: typography.heading,
  },
  actionText: {
    color: palette.text,
    fontSize: 12,
    fontFamily: typography.heading,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: palette.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: '70%',
    borderTopWidth: 1,
    borderColor: palette.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: palette.border,
  },
  modalTitle: {
    color: palette.text,
    fontSize: 20,
    fontFamily: typography.heading,
  },
  closeBtn: {
    padding: 4,
  },
  notifCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    marginBottom: 10,
  },
  notifUnread: {
    borderColor: '#2aa8f2',
    backgroundColor: '#162e48',
  },
  notifTitle: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 16,
  },
  notifMessage: {
    color: palette.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  notifActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
});

export default ContactsScreen;
