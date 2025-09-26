import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../api/client';

const FriendsMapScreen = () => {
  const [locations, setLocations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await apiFetch('/api/social/location/friends/');
      const data = res.ok ? await res.json() : [];
      setLocations(data);
    } catch (e) {}
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 7000);
    return () => clearInterval(id);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends Locations</Text>
      </View>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        {locations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No shared locations yet</Text>
            <Text style={styles.subText}>Ask friends to enable in-app sharing</Text>
          </View>
        ) : (
          locations.map((loc) => (
            <View key={loc.user?.id} style={styles.card}>
              <Text style={styles.username}>@{loc.user?.username}</Text>
              <Text style={styles.coords}>Lat {Number(loc.lat).toFixed(5)}, Lon {Number(loc.lon).toFixed(5)}</Text>
              <Text style={styles.time}>{new Date(loc.updated_at).toLocaleString()}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#fff', fontSize: 16, marginBottom: 6 },
  subText: { color: '#aaa' },
  card: { backgroundColor: '#222', padding: 16, borderRadius: 12, marginBottom: 12 },
  username: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  coords: { color: '#6cf', marginBottom: 4 },
  time: { color: '#999', fontSize: 12 },
});

export default FriendsMapScreen;

