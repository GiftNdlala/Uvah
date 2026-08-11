import { Platform } from 'react-native';

export const palette = {
  bg: '#030c18',
  surface: '#0b1a2b',
  surfaceSoft: '#14263b',
  border: '#254261',
  text: '#f0f6ff',
  textMuted: '#9cb4cc',
  accent: '#ff3147',
  accentAlt: '#ff6f7d',
  warning: '#ffc857',
  danger: '#ff3147',
  success: '#34d399',
  info: '#61c9ff',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

export const typography = {
  display: Platform.select({ ios: 'ui-rounded', android: 'sans-serif-medium', default: 'System' }),
  heading: Platform.select({ ios: 'ui-rounded', android: 'sans-serif-medium', default: 'System' }),
  body: 'System',
};
