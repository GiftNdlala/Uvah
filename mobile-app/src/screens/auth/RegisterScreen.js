import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiFetch, clearTokens, setDemoMode, setTokens } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ScreenShell from '../../components/ScreenShell';
import { palette, radius, typography } from '../../theme/tokens';

const getRegistrationError = (data) => {
  if (typeof data?.detail === 'string') return data.detail;
  if (typeof data?.message === 'string') return data.message;

  const fieldError = Object.values(data || {}).find((value) => Array.isArray(value) && value[0]);
  if (fieldError) return String(fieldError[0]);

  return 'Registration failed. Please try again.';
};

const RegisterScreen = ({ navigation }) => {
  const { setIsAuthenticated } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please complete all required fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/accounts/auth/register/', {
        method: 'POST',
        body: { username: username.trim(), password },
      });
      const data = await res.json();
      if (!res.ok || !data?.tokens?.access) {
        throw new Error(getRegistrationError(data));
      }
      await setDemoMode(false);
      await setTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
      setIsAuthenticated(true);
    } catch (e) {
      setError(e.message || 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenShell scroll>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Start safer check-ins with people you trust.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="pick a username"
          placeholderTextColor={palette.textMuted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="set a password"
          placeholderTextColor={palette.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          style={styles.input}
          placeholder="repeat your password"
          placeholderTextColor={palette.textMuted}
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.cta} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color={palette.text} /> : <Text style={styles.ctaText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={async () => {
            await clearTokens();
            await setDemoMode(true);
            setIsAuthenticated(true);
          }}
        >
          <Text style={styles.ghostText}>Skip for now (Demo)</Text>
        </TouchableOpacity>
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    marginTop: 18,
    marginBottom: 10,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  backBtnText: {
    color: palette.text,
  },
  title: {
    color: palette.text,
    fontFamily: typography.display,
    fontSize: 32,
  },
  subtitle: {
    color: palette.textMuted,
    marginTop: 6,
    marginBottom: 18,
    fontSize: 14,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
  },
  label: {
    color: palette.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  error: {
    color: palette.danger,
    marginBottom: 8,
  },
  cta: {
    marginTop: 6,
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  ctaText: {
    color: palette.text,
    fontSize: 16,
    fontFamily: typography.heading,
  },
  ghostBtn: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: radius.md,
    borderColor: palette.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#162b3d',
  },
  ghostText: {
    color: palette.info,
    fontSize: 14,
  },
});

export default RegisterScreen;
