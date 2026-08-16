import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiFetch } from '../../api/client';
import ScreenShell from '../../components/ScreenShell';
import TrustedCircleMap from '../../components/TrustedCircleMap';
import { useFriendLocations } from '../../context/FriendLocationsContext';
import { palette, radius, typography } from '../../theme/tokens';




const HomeScreen = ({ navigation }) => {
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('Safe and online');
  const [profileName, setProfileName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const timerRef = useRef(null);

  const { friendLocations, userLocation, refreshAll } = useFriendLocations();

  const mapUserLocation = useMemo(() => {
    if (!userLocation) return null;
    return { ...userLocation, avatarUrl: avatarUrl || userLocation.avatarUrl };
  }, [userLocation, avatarUrl]);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          await refreshAll(true);
          const profRes = await apiFetch('/api/accounts/profile/me/');
          if (profRes.ok) {
            const prof = await profRes.json();
            setProfileName(prof.first_name || prof.username || 'Friend');
            setAvatarUrl(prof.avatar_url || null);
          }
        } catch (_) {}
      };
      loadProfile();
    }, [refreshAll]),
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const postLocation = async (alertId) => {
    const lat = userLocation ? userLocation.latitude : -26.2041 + Math.random() * 0.001;
    const lon = userLocation ? userLocation.longitude : 28.0473 + Math.random() * 0.001;

    await apiFetch(`/api/alerts/${alertId}/locations`, {
      method: 'POST',
      body: { lat, lon, accuracy: 20 },
    });

    try {
      await apiFetch('/api/social/location/update/', {
        method: 'POST',
        body: { lat, lon, accuracy: 20 },
      });
    } catch (_) {}
  };

  const startLocationLoop = (alertId) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      postLocation(alertId).catch(() => null);
    }, 5000);
  };

  const activateSOS = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/alerts', {
        method: 'POST',
        body: {
          severity_level: 2,
          trigger_count: 2,
          trigger_source: 'app',
          message: 'Emergency SOS activated',
        },
      });

      if (!response.ok) {
        throw new Error('Could not activate SOS.');
      }

      const data = await response.json();
      setAlertData(data);
      setStatusText('SOS active and sharing live location');
      startLocationLoop(data.id);
    } catch (e) {
      Alert.alert('SOS Error', e.message || 'Network issue while starting SOS.');
    } finally {
      setLoading(false);
    }
  };

  const startSOS = () => {
    Alert.alert('Start SOS', 'This will start active emergency sharing.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', style: 'destructive', onPress: activateSOS },
    ]);
  };

  const sendCheckIn = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/alerts', {
        method: 'POST',
        body: {
          severity_level: 1,
          trigger_count: 1,
          trigger_source: 'checkin',
          message: 'Arrival check-in',
        },
      });

      if (!response.ok) {
        throw new Error('Check-in could not be sent.');
      }

      Alert.alert('Check-in sent', 'Your trusted circle can see your update.');
    } catch (e) {
      Alert.alert('Check-in error', e.message || 'Network issue while checking in.');
    } finally {
      setLoading(false);
    }
  };

  const cancelSOS = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setAlertData(null);
    setStatusText('Safe and online');
  };

  const shareLocation = async () => {
    if (!alertData?.share_url) return;

    const text = encodeURIComponent(`SOS - I need help. Track me live: ${alertData.share_url}`);

    try {
      const hasWhatsApp = await Linking.canOpenURL('whatsapp://send');
      if (hasWhatsApp) {
        await Linking.openURL(`whatsapp://send?text=${text}`);
      } else {
        await Linking.openURL(`sms:&body=${text}`);
      }
    } catch (_) {
      Alert.alert('Share failed', 'Could not open a sharing app.');
    }
  };

  return (
    <ScreenShell scroll includeBottomInset={false}>
      <View style={styles.heroCard}>
        <Text style={styles.heroText}>Hey {profileName || 'there'}! Stay connected with your trusted circle.</Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.exploreText}>Explore Map</Text>
          <Icon name="chevron-forward" size={16} color={palette.text} />
        </TouchableOpacity>
      </View>

      {alertData ? (
        <View style={styles.sosLiveCard}>
          <View>
            <Text style={styles.sosLiveTitle}>SOS is active</Text>
            <Text style={styles.sosLiveSub}>{statusText}</Text>
          </View>
          <View style={styles.sosActions}>
            <TouchableOpacity style={styles.sosGhostBtn} onPress={shareLocation}><Text style={styles.sosGhostText}>Share</Text></TouchableOpacity>
            <TouchableOpacity style={styles.sosStopBtn} onPress={cancelSOS}><Text style={styles.sosStopText}>Stop</Text></TouchableOpacity>
          </View>
        </View>
      ) : null}

      <View style={styles.mapCard}>
        <Text style={styles.mapCardTitle}>You and your trusted circle</Text>
        <TrustedCircleMap
          userLocation={mapUserLocation}
          friendLocations={friendLocations}
          showFriends
          showUserMarker
          style={styles.mapWrap}
          mapStyle={styles.map}
        />
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={[styles.actionTile, styles.tileGreen]} onPress={sendCheckIn} disabled={loading}>
          {loading ? <ActivityIndicator color={palette.text} /> : <Icon name="checkmark-circle" size={20} color={palette.text} />}
          <Text style={styles.actionTitle}>Check In</Text>
          <Text style={styles.actionSub}>Arrival update</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionTile, styles.tileBlue]} onPress={() => navigation.navigate('Friends')}>
          <Icon name="person-add" size={20} color={palette.text} />
          <Text style={styles.actionTitle}>Invite Friends</Text>
          <Text style={styles.actionSub}>Build your circle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionTile, styles.tileRed]}
          onPress={alertData ? cancelSOS : startSOS}
          disabled={loading}
        >
          <Icon name={alertData ? 'stop-circle' : 'warning'} size={20} color={palette.text} />
          <Text style={styles.actionTitle}>{alertData ? 'Stop Alert' : 'Safety Alert'}</Text>
          <Text style={styles.actionSub}>{alertData ? 'End SOS mode' : 'Trigger SOS'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionTile, styles.tileSlate]} onPress={() => navigation.navigate('Alerts')}>
          <Icon name="flame" size={20} color={palette.text} />
          <Text style={styles.actionTitle}>Trend Alerts</Text>
          <Text style={styles.actionSub}>What's hot</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Friends Nearby</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Friends')}><Text style={styles.sectionLink}>See all</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsRow}>
        {friendLocations.length > 0 ? friendLocations.map((loc) => (
          <TouchableOpacity key={String(loc.user?.id)} style={styles.friendChip} onPress={() => navigation.navigate('FriendDetail', { username: loc.user?.username })}>
            <View style={styles.friendAvatar}><Text style={styles.friendAvatarText}>{loc.user?.username?.charAt(0).toUpperCase()}</Text></View>
            <Text style={styles.friendName}>@{loc.user?.username}</Text>
            <Text style={styles.friendDistance}>Live</Text>
          </TouchableOpacity>
        )) : (
          <Text style={{color: palette.textMuted, marginLeft: 6}}>No friends nearby.</Text>
        )}
      </ScrollView>

    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    marginTop: 4,
    borderRadius: radius.lg,
    backgroundColor: '#101f35',
    borderWidth: 1,
    borderColor: palette.border,
    padding: 14,
  },
  heroText: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 26,
    lineHeight: 34,
  },
  exploreBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    backgroundColor: '#ff3147',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  exploreText: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 15,
  },
  sosLiveCard: {
    marginTop: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#8d3a47',
    backgroundColor: '#3b1823',
    padding: 12,
  },
  sosLiveTitle: {
    color: '#fff',
    fontFamily: typography.heading,
    fontSize: 16,
  },
  sosLiveSub: {
    color: '#f5d9de',
    marginTop: 2,
    fontSize: 12,
  },
  sosActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  sosGhostBtn: {
    borderWidth: 1,
    borderColor: '#7b90a6',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sosGhostText: {
    color: palette.text,
    fontSize: 12,
  },
  sosStopBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#8d3040',
  },
  sosStopText: {
    color: '#fff',
    fontFamily: typography.heading,
    fontSize: 12,
  },
  tabRow: {
    marginTop: 14,
    flexDirection: 'row',
    backgroundColor: '#0c1c30',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#162e48',
  },
  tabText: {
    color: palette.textMuted,
    fontSize: 12,
    fontFamily: typography.heading,
  },
  tabTextActive: {
    color: palette.text,
  },
  mapCard: {
    marginTop: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#0f2238',
    padding: 12,
  },
  mapCardTitle: {
    color: palette.text,
    fontSize: 14,
    fontFamily: typography.heading,
    marginBottom: 8,
  },
  mapWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    height: 170,
  },
  map: {
    flex: 1,
  },
  actionGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionTile: {
    width: '48%',
    minHeight: 92,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  tileGreen: {
    backgroundColor: '#322037',
    borderColor: '#a14555',
  },
  tileBlue: {
    backgroundColor: '#1c2f49',
    borderColor: '#3d628f',
  },
  tileRed: {
    backgroundColor: '#4c1724',
    borderColor: '#b94a5f',
  },
  tileSlate: {
    backgroundColor: '#252f46',
    borderColor: '#4f6287',
  },
  actionTitle: {
    color: '#fff',
    fontFamily: typography.heading,
    fontSize: 16,
  },
  actionSub: {
    color: '#d6e4ef',
    fontSize: 12,
  },
  sectionHeaderRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 28,
  },
  sectionLink: {
    color: palette.info,
    fontSize: 13,
    fontFamily: typography.heading,
  },
  friendsRow: {
    gap: 10,
    paddingTop: 8,
    paddingBottom: 4,
  },
  friendChip: {
    width: 86,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#11293c',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  friendAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#245170',
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: typography.heading,
  },
  friendName: {
    marginTop: 8,
    color: palette.text,
    fontSize: 13,
    fontFamily: typography.heading,
  },
  friendDistance: {
    marginTop: 2,
    color: '#b8d7ee',
    fontSize: 11,
  },
  eventsRow: {
    marginTop: 8,
    gap: 8,
    marginBottom: 0,
  },
  eventCard: {
    borderRadius: radius.lg,
    padding: 14,
    minHeight: 110,
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
  },
  eventOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  eventTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: typography.heading,
  },
  eventSub: {
    color: '#d8e6f2',
    marginTop: 3,
    fontSize: 13,
  },
  eventsHint: {
    color: palette.textMuted,
    marginLeft: 6,
    marginTop: 4,
    lineHeight: 20,
  },
});

export default HomeScreen;

