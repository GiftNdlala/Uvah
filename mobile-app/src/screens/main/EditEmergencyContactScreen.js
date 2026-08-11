import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ScreenShell from '../../components/ScreenShell';
import { apiFetch } from '../../api/client';
import { palette, radius, typography } from '../../theme/tokens';

const EditEmergencyContactScreen = ({ route, navigation }) => {
  const profile = route?.params?.profile || {};
  const [name, setName] = useState(profile.emergencyContact || profile.emergency_contact || '');
  const [phone, setPhone] = useState(profile.emergencyContactPhone || profile.emergency_contact_phone || '');

  const save = async () => {
    try {
      const res = await apiFetch('/api/accounts/profile/me/', {
        method: 'PATCH',
        body: {
          emergency_contact: name.trim(),
          emergency_contact_phone: phone.trim(),
        },
      });
      if (!res.ok) {
        throw new Error('Could not save emergency contact');
      }
      Alert.alert('Saved', 'Emergency contact updated successfully.');
      navigation.goBack();
    } catch (_) {
      Alert.alert('Save failed', 'Could not update emergency contact right now.');
    }
  };

  return (
    <ScreenShell>
      <ScrollView>
        <Text style={styles.title}>Emergency Contact</Text>
        <Text style={styles.subtitle}>This person is notified first during SOS events.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Contact Name</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Contact name" placeholderTextColor={palette.textMuted} />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput value={phone} onChangeText={setPhone} style={styles.input} placeholder="+27..." placeholderTextColor={palette.textMuted} keyboardType="phone-pad" />

          <TouchableOpacity style={styles.saveBtn} onPress={save}>
            <Text style={styles.saveText}>Save Contact</Text>
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
    backgroundColor: palette.accentAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 15,
  },
});

export default EditEmergencyContactScreen;
