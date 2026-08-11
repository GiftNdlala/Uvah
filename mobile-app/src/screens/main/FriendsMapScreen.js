import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenShell from '../../components/ScreenShell';
import TrustedCircleMap from '../../components/TrustedCircleMap';
import { useFriendLocations } from '../../context/FriendLocationsContext';
import { palette, radius, typography } from '../../theme/tokens';

const FriendsMapScreen = ({ route }) => {
  const { friendLocations, userLocation, refreshAll } = useFriendLocations();
  const focusedLocation = route?.params?.focusedLocation;

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
        <View>
          <Text style={styles.title}>Trusted Circle Map</Text>
          <Text style={styles.subtitle}>
            You + {friendLocations.length} friend{friendLocations.length === 1 ? '' : 's'} on map
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={() => refreshAll(true)}>
          <Icon name="refresh" size={16} color={palette.text} />
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <TrustedCircleMap
        userLocation={userLocation}
        friendLocations={friendLocations}
        focusedLocation={focusedLocation}
        showFriends
        showUserMarker
        style={styles.mapWrap}
        mapStyle={styles.map}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: palette.text,
    fontSize: 28,
    fontFamily: typography.display,
  },
  subtitle: {
    color: palette.textMuted,
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  refreshText: {
    color: palette.text,
    fontSize: 12,
    fontFamily: typography.heading,
  },
  mapWrap: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
});

export default FriendsMapScreen;
