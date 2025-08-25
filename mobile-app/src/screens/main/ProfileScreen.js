import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+27 82 123 4567',
    email: 'john.doe@example.com',
    emergencyContact: 'Jane Doe',
    emergencyContactPhone: '+27 82 987 6543',
  });
  const [settings, setSettings] = useState({
    locationSharing: true,
    pushNotifications: true,
    emergencyAlerts: true,
    dataSaving: false,
  });
  const [loading, setLoading] = useState(false);

  const BASE_URL = 'http://192.168.0.100:8000'; // TODO: replace with your laptop LAN IP

  useEffect(() => {
    // TODO: Load user profile from API
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/profile/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header with JWT token
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        console.log('Failed to load profile');
      }
    } catch (error) {
      console.log('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingToggle = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { profile });
  };

  const handleEditEmergencyContact = () => {
    navigation.navigate('EditEmergencyContact', { 
      emergencyContact: profile.emergencyContact,
      emergencyContactPhone: profile.emergencyContactPhone 
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // TODO: Clear stored tokens and navigate to login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // TODO: Implement account deletion
          Alert.alert('Not Implemented', 'Account deletion will be available in a future update.');
        }},
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6cf" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Demo Mode Banner */}
      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>🚀 Demo Mode - Frontend Showcase</Text>
      </View>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>
              {profile.firstName} {profile.lastName}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{profile.phoneNumber}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile.email || 'Not provided'}</Text>
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <TouchableOpacity onPress={handleEditEmergencyContact}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contact Name</Text>
            <Text style={styles.infoValue}>{profile.emergencyContact}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contact Phone</Text>
            <Text style={styles.infoValue}>{profile.emergencyContactPhone}</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Location Sharing</Text>
            <Switch
              value={settings.locationSharing}
              onValueChange={() => handleSettingToggle('locationSharing')}
              trackColor={{ false: '#555', true: '#6cf' }}
              thumbColor={settings.locationSharing ? '#fff' : '#ccc'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={settings.pushNotifications}
              onValueChange={() => handleSettingToggle('pushNotifications')}
              trackColor={{ false: '#555', true: '#6cf' }}
              thumbColor={settings.pushNotifications ? '#fff' : '#ccc'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Emergency Alerts</Text>
            <Switch
              value={settings.emergencyAlerts}
              onValueChange={() => handleSettingToggle('emergencyAlerts')}
              trackColor={{ false: '#555', true: '#6cf' }}
              thumbColor={settings.emergencyAlerts ? '#fff' : '#ccc'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Data Saving Mode</Text>
            <Switch
              value={settings.dataSaving}
              onValueChange={() => handleSettingToggle('dataSaving')}
              trackColor={{ false: '#555', true: '#6cf' }}
              thumbColor={settings.dataSaving ? '#fff' : '#ccc'}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <Text style={styles.actionButtonText}>Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteAccount}>
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    color: '#6cf',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  editButton: {
    padding: 5,
  },
  editButtonText: {
    color: '#6cf',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6cf',
    marginBottom: 15,
  },
  editLink: {
    color: '#6cf',
    fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    fontSize: 16,
    color: '#ccc',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  actionButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  dangerButton: {
    backgroundColor: '#e53935',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ProfileScreen;
