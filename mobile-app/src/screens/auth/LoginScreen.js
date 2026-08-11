import React, { useState } from 'react';
import { ActivityIndicator, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiFetch, clearTokens, setDemoMode, setTokens } from '../../api/client';
import { palette, radius, typography } from '../../theme/tokens';
import ScreenShell from '../../components/ScreenShell';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await apiFetch('/api/accounts/auth/login/', {
        method: 'POST',
        body: { username: username.trim(), password },
      });
      const data = await res.json();
      if (!res.ok || !data?.tokens?.access) {
        throw new Error(data?.detail || 'Login failed.');
      }
      await setDemoMode(false);
      await setTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
      navigation.replace('MainApp');
    } catch (e) {
      setError(e.message || 'Could not log in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell scroll showBrand={false} contentContainerStyle={styles.shellContent}>
      <View style={styles.backgroundWrap}>
        <ImageBackground
          source={require('../../../assets/images/Uvah_logo.png')}
          style={styles.loginBackground}
          imageStyle={styles.loginBackgroundImage}
        >
          <View style={styles.loginOverlay} />
        </ImageBackground>

        <SafeAreaView edges={['top']} style={styles.loginContent}>
        <View style={styles.hero}>
          <Text style={styles.brand}>UVAH</Text>
          <Text style={styles.tagline}>Safety + location, made local.</Text>
        </View>

        <View style={styles.formStack}>
          <Text style={styles.sectionTitle}>Welcome back</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="your username"
            placeholderTextColor={palette.textMuted}
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="your password"
            placeholderTextColor={palette.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.cta} onPress={handleLogin} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color={palette.text} /> : <Text style={styles.ctaText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Create a new account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoBtn}
            onPress={async () => {
              await clearTokens();
              await setDemoMode(true);
              navigation.replace('MainApp');
            }}
          >
            <Icon name="flash" size={16} color={palette.text} />
            <Text style={styles.demoText}>Continue in Demo Mode</Text>
          </TouchableOpacity>
        </View>
        </SafeAreaView>
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  shellContent: {
    flexGrow: 1,
    paddingBottom: 26,
  },
  backgroundWrap: {
    marginTop: 0,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 0,
    minHeight: 740,
    backgroundColor: 'transparent',
  },
  loginBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  loginBackgroundImage: {
    opacity: 0.98,
  },
  loginOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  loginContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
  },
  hero: {
    marginTop: 28,
    marginBottom: 20,
  },
  brand: {
    color: palette.text,
    fontFamily: typography.display,
    fontSize: 50,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 9,
  },
  tagline: {
    color: '#dceeff',
    marginTop: 4,
    fontSize: 15,
  },
  formStack: {
    marginTop: 8,
    padding: 18,
  },
  sectionTitle: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 22,
    marginBottom: 18,
  },
  label: {
    color: palette.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(20, 38, 59, 0.55)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(97, 201, 255, 0.36)',
    color: palette.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 14,
  },
  error: {
    color: palette.danger,
    marginBottom: 8,
    fontSize: 13,
  },
  cta: {
    marginTop: 2,
    backgroundColor: palette.accent,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ctaText: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 16,
  },
  linkBtn: {
    marginTop: 14,
    alignItems: 'center',
  },
  linkText: {
    color: palette.info,
    fontSize: 14,
  },
  demoBtn: {
    marginTop: 16,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: 'rgba(24, 49, 73, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexDirection: 'row',
  },
  demoText: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 14,
  },
});

export default LoginScreen;
