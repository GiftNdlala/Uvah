import React, { useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenShell from '../../components/ScreenShell';
import TrustedCircleMap from '../../components/TrustedCircleMap';
import { useFriendLocations } from '../../context/FriendLocationsContext';
import { palette, radius, typography } from '../../theme/tokens';

const MapScreen = () => {
  const { userLocation, friendLocations, refreshAll } = useFriendLocations();
  const [showFriends, setShowFriends] = useState(true);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const refreshRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      refreshAll(true);
      const id = setInterval(() => refreshAll(false), 15000);
      return () => clearInterval(id);
    }, [refreshAll]),
  );

  return (
    <ScreenShell showBrand={false} bodyStyle={{ paddingHorizontal: 0 }} style={{ paddingHorizontal: 0 }}>
      <View style={styles.headerRowFull}>
        <Text style={styles.title}>Map</Text>
      </View>

      <View style={styles.fullMapContainer}>
        <TrustedCircleMap
          userLocation={userLocation}
          friendLocations={friendLocations}
          showFriends={showFriends}
          focusedLocation={focusedLocation}
          style={styles.mapWrap}
          mapStyle={styles.map}
        />

        <View style={styles.floatingControls} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              setFocusedLocation(userLocation || null);
            }}
          >
            <Text style={styles.fabText}>You</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              refreshAll(true);
            }}
          >
            <Text style={styles.fabText}>↻</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowFriends((s) => !s)}
          >
            <Text style={styles.fabText}>{showFriends ? 'F' : 'f'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  headerRowFull: {
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 18,
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
  fullMapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapWrap: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 0,
    marginBottom: 0,
  },
  map: {
    flex: 1,
  },
  floatingControls: {
    position: 'absolute',
    right: 16,
    top: 84,
    flexDirection: 'column',
    gap: 12,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#15384f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 8,
  },
  fabText: {
    color: palette.text,
    fontWeight: '700',
  },
});

export default MapScreen;
