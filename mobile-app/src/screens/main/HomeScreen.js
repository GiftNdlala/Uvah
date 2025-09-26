import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch } from '../../api/client';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Checking...');
  const timerRef = useRef(null);

  const BASE_URL = 'http://192.168.0.100:8000'; // TODO: replace with your laptop LAN IP

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startSOS = async () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to start an emergency SOS? This will alert your emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start SOS', style: 'destructive', onPress: confirmSOS },
      ]
    );
  };

  const confirmSOS = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header with JWT token
        },
        body: JSON.stringify({
          severity_level: 2,
          trigger_count: 2,
          trigger_source: 'app',
          message: 'Emergency SOS activated',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAlert(data);
        setLocationStatus('SOS Active - Sharing Location');
        
        // Start location sharing
        startLocationSharing(data.id);
        
        Alert.alert(
          'SOS Activated',
          'Emergency SOS is now active. Your location is being shared with emergency contacts.',
          [{ text: 'OK' }]
        );
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Failed to start SOS');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startLocationSharing = (alertId) => {
    // TODO: Implement real GPS location sharing
    timerRef.current = setInterval(async () => {
      try {
        // Mock location for now - replace with real GPS
        const lat = -26.2041 + Math.random() * 0.001;
        const lon = 28.0473 + Math.random() * 0.001;
        
        await fetch(`${BASE_URL}/api/alerts/${alertId}/locations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // TODO: Add Authorization header
          },
          body: JSON.stringify({
            lat,
            lon,
            accuracy: 20,
            timestamp: new Date().toISOString(),
          }),
        });

        // In-app friends location share (latest location)
        try {
          await apiFetch('/api/social/location/update/', {
            method: 'POST',
            body: { lat, lon, accuracy: 20 },
          });
        } catch (_) {}
      } catch (error) {
        console.log('Location update failed:', error);
      }
    }, 5000); // Update every 5 seconds
  };

  const cancelSOS = () => {
    Alert.alert(
      'Cancel SOS',
      'Are you sure you want to cancel the emergency SOS?',
      [
        { text: 'No, Keep Active', style: 'cancel' },
        { text: 'Cancel SOS', style: 'destructive', onPress: () => {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          setAlert(null);
          setLocationStatus('Ready');
        }},
      ]
    );
  };

  const checkIn = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header
        },
        body: JSON.stringify({
          severity_level: 1,
          trigger_count: 1,
          trigger_source: 'checkin',
          message: 'Ngifikile! (I have arrived)',
        }),
      });

      if (response.ok) {
        Alert.alert('Check-in Sent', 'Your location has been shared with your contacts.');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.message || 'Check-in failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const shareLocation = async () => {
    if (!alert) return;
    
    const text = encodeURIComponent(
      `SOS – I need help. Track me live: ${alert.share_url}`
    );
    
    try {
      const canOpenWhatsApp = await Linking.canOpenURL('whatsapp://send');
      if (canOpenWhatsApp) {
        await Linking.openURL(`whatsapp://send?text=${text}`);
      } else {
        await Linking.openURL(`sms:&body=${text}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open sharing app');
    }
  };

  const openProfile = () => {
    navigation.navigate('Profile');
  };

  const openContacts = () => {
    navigation.navigate('Contacts');
  };

  const openAlerts = () => {
    navigation.navigate('Alerts');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Demo Mode Banner */}
      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>🚀 Demo Mode - Frontend Showcase</Text>
      </View>
      
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello!</Text>
        <Text style={styles.status}>{locationStatus}</Text>
      </View>

      <View style={styles.mainActions}>
        {!alert ? (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.sosButton]}
              onPress={startSOS}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="large" />
              ) : (
                <>
                  <Text style={styles.sosText}>SOS</Text>
                  <Text style={styles.sosSubtext}>Emergency Help</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.checkinButton]}
              onPress={checkIn}
              disabled={loading}
            >
              <Text style={styles.checkinText}>Ngifikile</Text>
              <Text style={styles.checkinSubtext}>Check-in</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.sosActive}>
            <Text style={styles.sosActiveTitle}>SOS Active</Text>
            <Text style={styles.sosActiveSubtitle}>
              Emergency contacts notified
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={shareLocation}
            >
              <Text style={styles.shareText}>Share Location</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={cancelSOS}
            >
              <Text style={styles.cancelText}>Cancel SOS</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={openProfile}>
          <Text style={styles.quickButtonText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickButton} onPress={openContacts}>
          <Text style={styles.quickButtonText}>Contacts</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickButton} onPress={openAlerts}>
          <Text style={styles.quickButtonText}>Alerts</Text>
        </TouchableOpacity>
      </View>

      {alert && (
        <View style={styles.alertInfo}>
          <Text style={styles.alertInfoText}>
            Share this link with people who need to track you:
          </Text>
          <Text style={styles.alertLink}>{alert.share_url}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  demoBanner: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#45a049',
  },
  demoBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    color: '#6cf',
    fontWeight: '500',
  },
  mainActions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  actionButton: {
    width: width * 0.8,
    height: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosButton: {
    backgroundColor: '#e53935',
  },
  checkinButton: {
    backgroundColor: '#2196f3',
  },
  shareButton: {
    backgroundColor: '#4caf50',
  },
  cancelButton: {
    backgroundColor: '#ff9800',
  },
  sosText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  sosSubtext: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  checkinText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  checkinSubtext: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  shareText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cancelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  sosActive: {
    alignItems: 'center',
  },
  sosActiveTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e53935',
    marginBottom: 5,
  },
  sosActiveSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  quickButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  alertInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  alertInfoText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  alertLink: {
    color: '#6cf',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default HomeScreen;
