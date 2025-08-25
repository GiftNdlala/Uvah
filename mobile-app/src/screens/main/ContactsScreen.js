import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ContactsScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const BASE_URL = 'http://192.168.0.100:8000'; // TODO: replace with your laptop LAN IP

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/users/emergency-contacts/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header with JWT token
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      } else {
        // For now, use mock data
        setContacts([
          {
            id: 1,
            name: 'Jane Doe',
            phone: '+27 82 987 6543',
            relationship: 'Spouse',
            is_verified: true,
          },
          {
            id: 2,
            name: 'John Smith',
            phone: '+27 82 555 1234',
            relationship: 'Friend',
            is_verified: false,
          },
        ]);
      }
    } catch (error) {
      console.log('Error loading contacts:', error);
      // Use mock data on error
      setContacts([
        {
          id: 1,
          name: 'Jane Doe',
          phone: '+27 82 987 6543',
          relationship: 'Spouse',
          is_verified: true,
        },
        {
          id: 2,
          name: 'John Smith',
          phone: '+27 82 555 1234',
          relationship: 'Friend',
          is_verified: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    navigation.navigate('AddContact');
  };

  const handleEditContact = (contact) => {
    navigation.navigate('EditContact', { contact });
  };

  const handleDeleteContact = (contact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteContact(contact.id) },
      ]
    );
  };

  const deleteContact = async (contactId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/emergency-contacts/${contactId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header
        },
      });

      if (response.ok) {
        setContacts(prev => prev.filter(c => c.id !== contactId));
        Alert.alert('Success', 'Contact deleted successfully');
      } else {
        Alert.alert('Error', 'Failed to delete contact');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const handleVerifyContact = (contact) => {
    Alert.alert(
      'Verify Contact',
      `Send verification message to ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: () => sendVerification(contact) },
      ]
    );
  };

  const sendVerification = async (contact) => {
    try {
      const response = await fetch(`${BASE_URL}/api/users/verify-contact/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header
        },
        body: JSON.stringify({
          contact_id: contact.id,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Verification message sent to contact');
      } else {
        Alert.alert('Error', 'Failed to send verification');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6cf" />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Demo Mode Banner */}
      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>🚀 Demo Mode - Frontend Showcase</Text>
      </View>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No emergency contacts yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Add trusted people who will be notified in emergencies
            </Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddContact}>
              <Text style={styles.emptyStateButtonText}>Add First Contact</Text>
            </TouchableOpacity>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                <View style={styles.verificationStatus}>
                  <Text style={[
                    styles.verificationText,
                    { color: contact.is_verified ? '#4caf50' : '#ff9800' }
                  ]}>
                    {contact.is_verified ? '✓ Verified' : '⚠ Pending Verification'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.contactActions}>
                {!contact.is_verified && (
                  <TouchableOpacity
                    style={styles.verifyButton}
                    onPress={() => handleVerifyContact(contact)}
                  >
                    <Text style={styles.verifyButtonText}>Verify</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditContact(contact)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteContact(contact)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  demoBanner: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#45a049',
  },
  demoBannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  emptyStateButton: {
    backgroundColor: '#6cf',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '500',
  },
  contactCard: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  contactInfo: {
    marginBottom: 16,
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 16,
    color: '#6cf',
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  verificationStatus: {
    alignSelf: 'flex-start',
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  verifyButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#e53935',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ContactsScreen;
