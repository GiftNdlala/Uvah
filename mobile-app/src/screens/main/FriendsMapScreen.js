import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { apiFetch } from '../../api/client';

const initialRegion = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

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

  const region = useMemo(() => {
    if (!locations || locations.length === 0) return initialRegion;
    const first = locations[0];
    return {
      latitude: Number(first.lat) || initialRegion.latitude,
      longitude: Number(first.lon) || initialRegion.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [locations]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends Map</Text>
      </View>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        region={region}
      >
        {locations.map((loc) => (
          <Marker
            key={loc.user?.id}
            coordinate={{ latitude: Number(loc.lat), longitude: Number(loc.lon) }}
            title={`@${loc.user?.username}`}
            description={`Updated ${new Date(loc.updated_at).toLocaleTimeString()}`}
          />
        ))}
      </MapView>
      <View style={styles.footer}>
        <Text style={styles.footerText} onPress={() => { setRefreshing(true); load(); }}>
          Pull to refresh in map is not supported — tap to refresh now
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  header: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  map: { flex: 1 },
  footer: { padding: 10, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#333' },
  footerText: { color: '#6cf', textAlign: 'center' },
});

export default FriendsMapScreen;

