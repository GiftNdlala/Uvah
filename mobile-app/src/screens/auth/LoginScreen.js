import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, setTokens } from '../../api/client';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Enter username and password');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/accounts/auth/login/', {
        method: 'POST',
        body: { username, password },
      });
      const data = await res.json();
      if (!res.ok || !data?.tokens?.access) throw new Error(data?.detail || 'Login failed');
      await setTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
      navigation.replace('MainApp');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    // Static demo - bypass OTP verification
    setShowOtpInput(true);
    Alert.alert('Demo Mode', 'OTP verification bypassed for demo purposes');
  };

  const handleVerifyOtp = async () => {
    // Static demo - bypass authentication
    if (!otp || otp.length !== 6) {
      Alert.alert('Demo Mode', 'Please enter any 6-digit number for demo');
      return;
    }
    
    // Navigate directly to main app for demo
    navigation.replace('MainApp');
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Uvah?</Text>
        <Text style={styles.subtitle}>Where are you?</Text>
        <Text style={styles.description}>
          Township Safety & Location Sharing
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="your-username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleRegister}
          >
            <Text style={styles.secondaryButtonText}>
              New user? Create account
            </Text>
          </TouchableOpacity>

          {/* Demo Mode Button */}
          <TouchableOpacity style={styles.demoButton} onPress={() => navigation.replace('MainApp')}>
            <Text style={styles.demoButtonText}>🚀 Demo Mode - Skip to App</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#6cf',
    marginBottom: 5,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 40,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 300,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#555',
  },
  primaryButton: {
    backgroundColor: '#e53935',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: '#6cf',
    fontSize: 16,
  },
  demoButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#45a049',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
