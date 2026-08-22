import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenShell from '../../components/ScreenShell';
import TrustedCircleMap from '../../components/TrustedCircleMap';
import UvahBrandBar from '../../components/UvahBrandBar';
import { useFriendLocations } from '../../context/FriendLocationsContext';
import { palette, typography } from '../../theme/tokens';

const FriendsMapScreen = ({ route }) => {
  const { friendLocations, userLocation, refreshAll } = useFriendLocations();
  const [showFriends, setShowFriends] = useState(true);
  const [focusedLocation, setFocusedLocation] = useState(route?.params?.focusedLocation || null);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    const requestedLocation = route?.params?.focusedLocation;
    if (requestedLocation) setFocusedLocation({ ...requestedLocation, requestId: Date.now() });
  }, [route?.params?.focusedLocation]);

  useFocusEffect(
    React.useCallback(() => {
      refreshAll(true);
      const id = setInterval(() => refreshAll(false), 15000);
      return () => clearInterval(id);
    }, [refreshAll]),
  );

  const refreshMap = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await refreshAll(true);
    } finally {
      setRefreshing(false);
    }
  };

  const focusOnUser = () => {
    if (!userLocation) return;
    setFocusedLocation({ ...userLocation, requestId: Date.now() });
  };

  return (
    <ScreenShell showBrand={false} includeBottomInset={false} bodyStyle={styles.shellBody}>
      <View style={styles.fullMapContainer}>
        <TrustedCircleMap
          userLocation={userLocation}
          friendLocations={friendLocations}
          focusedLocation={focusedLocation}
          showFriends={showFriends}
          showUserMarker
          showsMyLocationButton={false}
          style={styles.mapWrap}
          mapStyle={styles.map}
        />

        <View style={styles.brandOverlay} pointerEvents="box-none">
          <UvahBrandBar style={styles.brandBar} />
        </View>

        <View style={styles.floatingControls} pointerEvents="box-none">
          <TouchableOpacity
            accessibilityLabel={showFriends ? 'Hide friends on map' : 'Show friends on map'}
            accessibilityRole="button"
            accessibilityState={{ selected: showFriends }}
            activeOpacity={0.8}
            hitSlop={8}
            style={[styles.fab, showFriends && styles.fabActive]}
            onPress={() => setShowFriends((visible) => !visible)}
          >
            <Icon name={showFriends ? 'people' : 'people-outline'} size={22} color={palette.text} />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Refresh map locations"
            accessibilityRole="button"
            activeOpacity={0.8}
            disabled={refreshing}
            hitSlop={8}
            style={[styles.fab, refreshing && styles.fabDisabled]}
            onPress={refreshMap}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={palette.text} />
            ) : (
              <Icon name="refresh" size={23} color={palette.text} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityLabel="Center map on my location"
            accessibilityRole="button"
            accessibilityState={{ disabled: !userLocation }}
            activeOpacity={0.8}
            disabled={!userLocation}
            hitSlop={8}
            style={[styles.fab, !userLocation && styles.fabDisabled]}
            onPress={focusOnUser}
          >
            <Icon name="locate" size={24} color={palette.text} />
            <Text style={styles.fabLabel}>You</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  shellBody: {
    paddingHorizontal: 0,
  },
  fullMapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapWrap: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    borderWidth: 0,
  },
  map: {
    flex: 1,
  },
  brandOverlay: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 30,
    elevation: 30,
  },
  brandBar: {
    backgroundColor: 'rgba(3, 12, 24, 0.9)',
  },
  floatingControls: {
    position: 'absolute',
    right: 16,
    top: 126,
    flexDirection: 'column',
    zIndex: 40,
    elevation: 40,
  },
  fab: {
    width: 54,
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(10, 35, 55, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
    zIndex: 41,
    elevation: 41,
  },
  fabActive: {
    borderColor: palette.info,
    backgroundColor: 'rgba(20, 64, 89, 0.96)',
  },
  fabDisabled: {
    opacity: 0.55,
  },
  fabLabel: {
    color: palette.text,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: typography.heading,
  },
});

export default FriendsMapScreen;
