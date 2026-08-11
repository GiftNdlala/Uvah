import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenShell from '../../components/ScreenShell';
import { apiFetch } from '../../api/client';
import { parseApiListResponse } from '../../utils/apiData';
import { palette, radius, typography } from '../../theme/tokens';

const FriendDetailScreen = ({ route }) => {
  const username = route?.params?.username || 'friend';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/social/location/friends/');
      const data = await parseApiListResponse(res);
      const match = data.find((item) => item.user?.username?.toLowerCase() === username.toLowerCase());
      setLocation(match || null);
    } catch (_) {
      setLocation(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const toggleShare = async (isActive) => {
    try {
      const res = await apiFetch('/api/social/live-share/toggle/', {
        method: 'POST',
        body: { viewer_username: username, is_active: isActive },
      });
      if (!res.ok) throw new Error('Failed');
      Alert.alert('Updated', isActive ? 'Sharing enabled.' : 'Sharing disabled.');
    } catch (_) {
      Alert.alert('Not ready yet', 'Sharing toggle endpoint still needs backend wiring.');
    }
  };

  if (loading) {
    return (
      <ScreenShell>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.accent} />
          <Text style={styles.loadingText}>Loading friend details</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={palette.accent} />}
      >
        <Text style={styles.title}>@{username}</Text>
        <Text style={styles.subtitle}>Live sharing controls and latest known location.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sharing Controls</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.enableBtn} onPress={() => toggleShare(true)}>
              <Text style={styles.btnText}>Enable Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.disableBtn} onPress={() => toggleShare(false)}>
              <Text style={styles.btnText}>Disable Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Latest Location</Text>
          {location ? (
            <>
              <Text style={styles.locationLine}>Latitude: {Number(location.lat).toFixed(6)}</Text>
              <Text style={styles.locationLine}>Longitude: {Number(location.lon).toFixed(6)}</Text>
              {location.accuracy != null ? (
                <Text style={styles.locationSub}>Accuracy: {Number(location.accuracy).toFixed(0)} m</Text>
              ) : null}
              <Text style={styles.locationSub}>Updated: {new Date(location.updated_at).toLocaleString()}</Text>
            </>
          ) : (
            <Text style={styles.emptyText}>No live location available from this friend yet.</Text>
          )}
        </View>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: palette.text,
    marginTop: 8,
  },
  title: {
    color: palette.text,
    fontSize: 32,
    fontFamily: typography.display,
    marginTop: 14,
  },
  subtitle: {
    color: palette.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    color: palette.text,
    fontSize: 16,
    fontFamily: typography.heading,
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  enableBtn: {
    flex: 1,
    borderRadius: radius.md,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#214f3a',
    borderWidth: 1,
    borderColor: '#3f7961',
  },
  disableBtn: {
    flex: 1,
    borderRadius: radius.md,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5d2f37',
    borderWidth: 1,
    borderColor: '#904a55',
  },
  btnText: {
    color: palette.text,
    fontFamily: typography.heading,
  },
  locationLine: {
    color: palette.info,
    fontSize: 14,
    marginBottom: 4,
  },
  locationSub: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: palette.textMuted,
  },
});

export default FriendDetailScreen;
