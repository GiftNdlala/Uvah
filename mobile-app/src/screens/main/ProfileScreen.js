import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenShell from '../../components/ScreenShell';
import { apiFetch, apiUpload } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFriendLocations } from '../../context/FriendLocationsContext';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { palette, radius, typography } from '../../theme/tokens';

const ProfileScreen = ({ navigation }) => {
  const { logout: endSession } = useAuth();
  const { refreshProfile } = useFriendLocations();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    emergencyContact: '',
    emergencyContactPhone: '',
    avatarUrl: null,
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [settings, setSettings] = useState({
    locationSharing: true,
    pushNotifications: true,
    emergencyAlerts: true,
    dataSaving: false,
  });

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await apiFetch('/api/accounts/profile/me/');
      if (!res.ok) {
        throw new Error('Could not load profile.');
      }
      const data = await res.json();
      setProfile({
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        phoneNumber: data.phone_number || data.username || '',
        email: data.email || '',
        emergencyContact: data.emergency_contact || '',
        emergencyContactPhone: data.emergency_contact_phone || '',
        avatarUrl: data.avatar_url || null,
      });
    } catch (e) {
      setLoadError(e.message || 'Unable to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const toggle = (key) => setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const pickAvatar = () => {
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800 },
      async (response) => {
        if (response.didCancel || response.errorCode) return;
        const asset = response.assets?.[0];
        if (!asset?.uri) return;

        setUploadingAvatar(true);
        try {
          const fileUri = Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', '');
          const formData = new FormData();
          formData.append('avatar', {
            uri: fileUri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || 'avatar.jpg',
          });
          const res = await apiUpload('/api/accounts/profile/me/avatar/', formData);
          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          setProfile((prev) => ({ ...prev, avatarUrl: data.avatar_url || null }));
          await refreshProfile();
          Alert.alert('Updated', 'Profile photo saved.');
        } catch (_) {
          Alert.alert('Upload failed', 'Could not update your profile photo.');
        } finally {
          setUploadingAvatar(false);
        }
      },
    );
  };

  const logout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await endSession();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenShell includeBottomInset={false}>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.accent} />
          <Text style={styles.loadingText}>Loading profile</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell includeBottomInset={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <TouchableOpacity style={styles.avatarCircle} onPress={pickAvatar} disabled={uploadingAvatar}>
            {profile.avatarUrl ? (
              <Image source={{ uri: resolveMediaUrl(profile.avatarUrl) }} style={styles.avatarImage} />
            ) : (
              <Icon name="person" size={32} color={palette.text} />
            )}
            {uploadingAvatar ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" size="small" />
              </View>
            ) : null}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{profile.firstName} {profile.lastName}</Text>
            <Text style={styles.subText}>{profile.phoneNumber}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.editPill} onPress={pickAvatar}>
              <Text style={styles.editPillText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editPill} onPress={() => navigation.navigate('EditProfile', { profile })}>
              <Text style={styles.editPillText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loadError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <Text style={styles.infoText}>Email: {profile.email || 'Not set'}</Text>
          <Text style={styles.infoText}>Emergency Contact: {profile.emergencyContact}</Text>
          <Text style={styles.infoText}>Emergency Phone: {profile.emergencyContactPhone}</Text>
          <TouchableOpacity style={styles.inlineBtn} onPress={() => navigation.navigate('EditEmergencyContact', { profile })}>
            <Text style={styles.inlineBtnText}>Update Emergency Contact</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Safety Preferences</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Location Sharing</Text>
            <Switch value={settings.locationSharing} onValueChange={() => toggle('locationSharing')} trackColor={{ false: '#455a68', true: '#2f9276' }} thumbColor="#f8fcff" />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch value={settings.pushNotifications} onValueChange={() => toggle('pushNotifications')} trackColor={{ false: '#455a68', true: '#2f9276' }} thumbColor="#f8fcff" />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Emergency Alerts</Text>
            <Switch value={settings.emergencyAlerts} onValueChange={() => toggle('emergencyAlerts')} trackColor={{ false: '#455a68', true: '#2f9276' }} thumbColor="#f8fcff" />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Data Saving Mode</Text>
            <Switch value={settings.dataSaving} onValueChange={() => toggle('dataSaving')} trackColor={{ false: '#455a68', true: '#2f9276' }} thumbColor="#f8fcff" />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: palette.text,
    marginTop: 8,
  },
  headerCard: {
    marginTop: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#19344b',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  nameText: {
    color: palette.text,
    fontSize: 20,
    fontFamily: typography.heading,
  },
  subText: {
    color: palette.textMuted,
    marginTop: 2,
  },
  errorCard: {
    marginTop: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#8a404b',
    backgroundColor: 'rgba(138, 64, 75, 0.24)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: '#ffd8df',
    fontSize: 12,
  },
  editPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#163047',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editPillText: {
    color: palette.info,
    fontSize: 12,
    fontFamily: typography.heading,
  },
  sectionCard: {
    marginTop: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 14,
  },
  sectionTitle: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 16,
    marginBottom: 10,
  },
  infoText: {
    color: palette.textMuted,
    marginBottom: 6,
  },
  inlineBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#173047',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineBtnText: {
    color: palette.info,
    fontSize: 12,
    fontFamily: typography.heading,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#22374a',
  },
  settingLabel: {
    color: palette.text,
  },
  logoutBtn: {
    marginTop: 16,
    marginBottom: 20,
    borderRadius: radius.md,
    backgroundColor: '#592d34',
    borderWidth: 1,
    borderColor: '#7f3d49',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: palette.text,
    fontSize: 15,
    fontFamily: typography.heading,
  },
});

export default ProfileScreen;
