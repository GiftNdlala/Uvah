import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenShell from '../../components/ScreenShell';
import TrustedCircleMap from '../../components/TrustedCircleMap';
import { useFriendLocations } from '../../context/FriendLocationsContext';
import { palette, radius, typography } from '../../theme/tokens';

const MapScreen = () => {
  const { userLocation, friendLocations, refreshAll } = useFriendLocations();

  useFocusEffect(
    React.useCallback(() => {
      refreshAll(true);
      const id = setInterval(() => refreshAll(false), 15000);
      return () => clearInterval(id);
    }, [refreshAll]),
  );

  return (
    <ScreenShell>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Location</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refreshAll(true)}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <TrustedCircleMap
        userLocation={userLocation}
        friendLocations={friendLocations}
        style={styles.mapWrap}
        mapStyle={styles.map}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    marginTop: 14,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: palette.text,
    fontSize: 26,
    fontFamily: typography.display,
  },
  refreshBtn: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  refreshText: {
    color: palette.info,
    fontSize: 12,
    fontFamily: typography.heading,
  },
  mapWrap: {
    flex: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;
