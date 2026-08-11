import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { resolveMediaUrl } from '../utils/mediaUrl';

const MapAvatarMarker = ({
  avatarUrl,
  fallbackLetter = '?',
  borderColor = '#2aa8f2',
  isStale = false,
  style,
  onPress,
  accessibilityLabel,
}) => {
  const uri = resolveMediaUrl(avatarUrl);
  const [hasError, setHasError] = useState(false);
  const markerColor = isStale ? '#f5a623' : borderColor;

  return (
    <Pressable
      accessible={Boolean(onPress)}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.wrap, { borderColor: markerColor }, style]}
    >
      {uri && !hasError ? (
        <Image
          source={{ uri }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : fallbackLetter ? (
        <View style={[styles.fallback, { backgroundColor: markerColor }]}>
          <Text style={styles.fallbackText}>{fallbackLetter}</Text>
        </View>
      ) : (
        <Icon name="location-sharp" size={34} color={markerColor} />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: '#0a1728',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  fallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default MapAvatarMarker;
