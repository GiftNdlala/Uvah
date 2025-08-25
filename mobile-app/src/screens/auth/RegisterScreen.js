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

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    phoneNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    emergencyContact: '',
    emergencyContactPhone: '',
  });
  const [loading, setLoading] = useState(false);

  const BASE_URL = 'http://192.168.0.100:8000'; // TODO: replace with your laptop LAN IP

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
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="+27 82 123 4567"
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange('phoneNumber', value)}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={formData.firstName}
            onChangeText={(value) => handleInputChange('firstName', value)}
          />

          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            value={formData.lastName}
            onChangeText={(value) => handleInputChange('lastName', value)}
          />

          <Text style={styles.label}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="your.email@example.com"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          
          <Text style={styles.label}>Contact Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Emergency contact name"
            value={formData.emergencyContact}
            onChangeText={(value) => handleInputChange('emergencyContact', value)}
          />

          <Text style={styles.label}>Contact Phone *</Text>
          <TextInput
            style={styles.input}
            placeholder="+27 82 123 4567"
            value={formData.emergencyContactPhone}
            onChangeText={(value) => handleInputChange('emergencyContactPhone', value)}
            keyboardType="phone-pad"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
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
