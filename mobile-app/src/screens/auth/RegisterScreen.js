import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiFetch, setTokens } from '../../api/client';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!formData.username || !formData.password) {
      Alert.alert('Error', 'Enter a username and password');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch('/api/accounts/auth/register/', {
        method: 'POST',
        body: { username: formData.username, password: formData.password },
      });
      const data = await res.json();
      if (!res.ok || !data?.tokens?.access) throw new Error(data?.detail || 'Registration failed');
      await setTokens({ access: data.tokens.access, refresh: data.tokens.refresh });
      Alert.alert('Welcome', 'Account created successfully');
      navigation.replace('MainApp');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    // Static demo - bypass registration validation
    if (!formData.firstName || !formData.lastName) {
      Alert.alert('Demo Mode', 'Please enter at least your first and last name for demo');
      return;
    }

    // Show success message and navigate to main app for demo
    Alert.alert(
      'Demo Mode',
      'Registration bypassed for demo purposes. Welcome to Uvah?!',
      [
        {
          text: 'Continue to App',
          onPress: () => navigation.replace('MainApp'),
        },
      ]
    );
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Uvah? for safety</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="your-username"
            value={formData.username}
            onChangeText={(value) => handleInputChange('username', value)}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleBackToLogin}
          >
            <Text style={styles.secondaryButtonText}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>

          {/* Demo Mode Button */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => navigation.replace('MainApp')}
          >
            <Text style={styles.demoButtonText}>
              🚀 Demo Mode - Skip to App
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginBottom: 20,
  },
  backButtonText: {
    color: '#6cf',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  form: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6cf',
    marginTop: 20,
    marginBottom: 15,
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
    marginTop: 20,
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

export default RegisterScreen;
