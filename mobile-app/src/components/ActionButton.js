import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { palette, radius, typography } from '../theme/tokens';

const ActionButton = ({ title, subtitle, icon, variant = 'primary', onPress, disabled }) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const buttonStyle = [
    styles.button,
    isPrimary && styles.primary,
    isSecondary && styles.secondary,
    variant === 'ghost' && styles.ghost,
    disabled && styles.disabled,
  ];

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={buttonStyle} activeOpacity={0.88}>
      {icon ? <Icon name={icon} size={20} color={palette.text} /> : null}
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: palette.border,
  },
  primary: {
    backgroundColor: palette.accent,
    borderColor: '#3ccf99',
  },
  secondary: {
    backgroundColor: palette.accentAlt,
    borderColor: '#61c4ff',
  },
  ghost: {
    backgroundColor: palette.surface,
  },
  disabled: {
    opacity: 0.45,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: palette.text,
    fontSize: 16,
    fontFamily: typography.heading,
  },
  subtitle: {
    color: '#d4e5f1',
    fontSize: 12,
    marginTop: 1,
  },
});

export default ActionButton;
