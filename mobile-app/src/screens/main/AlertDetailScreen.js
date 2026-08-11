import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenShell from '../../components/ScreenShell';
import { palette, radius, typography } from '../../theme/tokens';

const AlertDetailScreen = ({ route }) => {
  const alert = route?.params?.alert;

  if (!alert) {
    return (
      <ScreenShell>
        <View style={styles.centered}>
          <Text style={styles.title}>No alert selected</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScrollView>
        <Text style={styles.title}>Alert #{alert.id}</Text>
        <Text style={styles.subtitle}>Detailed timeline and sharing details.</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="alert-circle-outline" size={18} color={palette.warning} />
            <Text style={styles.rowText}>Severity: {alert.severity_level}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="radio-outline" size={18} color={palette.info} />
            <Text style={styles.rowText}>Status: {alert.status}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="time-outline" size={18} color={palette.accentAlt} />
            <Text style={styles.rowText}>Created: {new Date(alert.created_at).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.blockTitle}>Message</Text>
          <Text style={styles.blockText}>{alert.message || 'No message'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.blockTitle}>Share URL</Text>
          <Text style={styles.linkText}>{alert.share_url || 'Not available'}</Text>
        </View>
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
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  rowText: {
    color: palette.text,
  },
  blockTitle: {
    color: palette.text,
    fontFamily: typography.heading,
    marginBottom: 8,
  },
  blockText: {
    color: palette.textMuted,
  },
  linkText: {
    color: palette.info,
  },
});

export default AlertDetailScreen;
