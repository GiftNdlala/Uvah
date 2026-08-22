import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { palette, radius, typography } from '../theme/tokens';

const HomeMapReplacement = ({ friendLocations = [], alertData = null, navigation, styleWrap }) => {
  const nearbyCount = Array.isArray(friendLocations) ? friendLocations.length : 0;

  return (
    <View style={[styles.wrap, styleWrap]}>
      <View style={styles.leftCol}>
        <Text style={styles.title}>Trusted circle</Text>
        <Text style={styles.count}>{nearbyCount} nearby</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Map')}>
          <Icon name="map" size={16} color={palette.text} />
          <Text style={styles.actionText}>Open full map</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rightCol}>
        <Text style={styles.title}>Status</Text>
        <Text style={styles.sub}>{alertData ? 'SOS active' : 'All clear'}</Text>
        <TouchableOpacity style={[styles.actionBtn, styles.secondary]} onPress={() => navigation.navigate('Alerts')}>
          <Icon name="flame" size={16} color={palette.text} />
          <Text style={styles.actionText}>View alerts</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#081526',
  },
  leftCol: {
    flex: 1,
  },
  rightCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 14,
  },
  count: {
    color: '#b7dcec',
    marginTop: 6,
    fontSize: 20,
    fontFamily: typography.display,
  },
  sub: {
    color: '#c9dfe8',
    marginTop: 6,
    fontSize: 16,
  },
  actionBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: '#17384f',
  },
  actionText: {
    color: palette.text,
    marginLeft: 6,
    fontFamily: typography.heading,
  },
  secondary: {
    backgroundColor: '#2b2f3a',
  },
});

export default HomeMapReplacement;
