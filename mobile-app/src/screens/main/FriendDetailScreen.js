import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../api/client';

const FriendDetailScreen = ({ route, navigation }) => {
  const username = route?.params?.username || '';
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/social/location/friends/');
      const data = res.ok ? await res.json() : [];
      const match = data.find((l) => l.user?.username?.toLowerCase() === username.toLowerCase());
      setLocation(match || null);
    } catch (e) {
      setLocation(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [username]);

  useEffect(() => {
    navigation.setOptions?.({ headerShown: true, title: `@${username}` });
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load, navigation, username]);

  const toggleShare = async (isActive) => {
    try {
      const res = await apiFetch('/api/social/live-share/toggle/', {
        method: 'POST',
        body: { viewer_username: username, is_active: isActive },
      });
      if (!res.ok) throw new Error('Failed to update sharing');
      Alert.alert('Updated', isActive ? 'Sharing enabled' : 'Sharing disabled');
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#6cf" />
          <Text style={styles.loadingText}>Loading friend…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        <View style={styles.card}>
          <Text style={styles.username}>@{username}</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.primary} onPress={() => toggleShare(true)}>
              <Text style={styles.btnText}>Enable Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.danger} onPress={() => toggleShare(false)}>
              <Text style={styles.btnText}>Disable Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Friend’s Latest Location</Text>
          {location ? (
            <>
              <Text style={styles.locationLine}>Lat: {Number(location.lat).toFixed(6)}</Text>
              <Text style={styles.locationLine}>Lon: {Number(location.lon).toFixed(6)}</Text>
              {location.accuracy != null && (
                <Text style={styles.locationSub}>Accuracy: {Number(location.accuracy).toFixed(0)} m</Text>
              )}
              <Text style={styles.locationTime}>{new Date(location.updated_at).toLocaleString()}</Text>
            </>
          ) : (
            <Text style={styles.muted}>No in-app sharing from this friend yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  content: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#ccc', marginTop: 12 },
  card: { backgroundColor: '#222', borderRadius: 12, padding: 16, marginBottom: 16 },
  username: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  primary: { backgroundColor: '#4caf50', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  danger: { backgroundColor: '#e53935', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  locationLine: { color: '#6cf', fontSize: 14 },
  locationSub: { color: '#aaa', marginTop: 4 },
  locationTime: { color: '#888', marginTop: 8, fontSize: 12 },
  muted: { color: '#aaa' },
});

export default FriendDetailScreen;

