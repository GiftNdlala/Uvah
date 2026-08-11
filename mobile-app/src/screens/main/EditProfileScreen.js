import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ScreenShell from '../../components/ScreenShell';
import { apiFetch } from '../../api/client';
import { palette, radius, typography } from '../../theme/tokens';

const EditProfileScreen = ({ route, navigation }) => {
  const initial = route?.params?.profile || {};
  const [firstName, setFirstName] = useState(initial.firstName || initial.first_name || '');
  const [lastName, setLastName] = useState(initial.lastName || initial.last_name || '');
  const [email, setEmail] = useState(initial.email || '');

  const save = async () => {
    try {
      const res = await apiFetch('/api/accounts/profile/me/', {
        method: 'PATCH',
        body: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
        },
      });
      if (!res.ok) {
        throw new Error('Could not save profile');
      }
      Alert.alert('Saved', 'Profile updated successfully.');
      navigation.goBack();
    } catch (_) {
      Alert.alert('Save failed', 'Could not update profile right now.');
    }
  };

  return (
    <ScreenShell>
      <ScrollView>
        <Text style={styles.title}>Edit Profile</Text>
        <Text style={styles.subtitle}>Keep your details up to date for safer coordination.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>First Name</Text>
          <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} placeholder="First name" placeholderTextColor={palette.textMuted} />

          <Text style={styles.label}>Last Name</Text>
          <TextInput value={lastName} onChangeText={setLastName} style={styles.input} placeholder="Last name" placeholderTextColor={palette.textMuted} />

          <Text style={styles.label}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.input} placeholder="Email" placeholderTextColor={palette.textMuted} autoCapitalize="none" />

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: 14,
    color: palette.text,
    fontSize: 30,
    fontFamily: typography.display,
  },
  subtitle: {
    color: palette.textMuted,
    marginTop: 4,
    marginBottom: 12,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 14,
    marginBottom: 18,
  },
  label: {
    color: palette.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    backgroundColor: palette.surfaceSoft,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    color: palette.text,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 12,
  },
  saveBtn: {
    marginTop: 8,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 15,
  },
});

export default EditProfileScreen;
