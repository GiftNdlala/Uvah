import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NotificationBell from './NotificationBell';
import { palette, radius, typography } from '../theme/tokens';

const UvahBrandBar = ({ showNotifications = true }) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <View style={styles.topRow}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmarkMain}>Uvah</Text>
          <Text style={styles.wordmarkAccent}>?</Text>
        </View>
        {showNotifications ? <NotificationBell /> : null}
      </View>
      <Text style={styles.caption}>Stay visible. Stay safe.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    marginBottom: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#091224',
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  wordmarkMain: {
    color: '#f7fbff',
    fontFamily: typography.display,
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: 0.6,
  },
  wordmarkAccent: {
    color: palette.accent,
    fontFamily: typography.display,
    fontSize: 52,
    lineHeight: 52,
    marginLeft: 2,
    textShadowColor: 'rgba(255, 49, 71, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  glow: {
    position: 'absolute',
    right: -48,
    top: -44,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 49, 71, 0.24)',
  },
  caption: {
    marginTop: 2,
    color: palette.textMuted,
    fontFamily: typography.body,
    fontSize: 12,
  },
});

export default UvahBrandBar;
