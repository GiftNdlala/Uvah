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
import { apiFetch } from '../../api/client';

const ContactsScreen = ({ navigation }) => {
  const [friends, setFriends] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const BASE_URL = 'http://192.168.0.100:8000'; // TODO: replace with your laptop LAN IP

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const [friendsRes, incomingRes] = await Promise.all([
        apiFetch(`/api/social/friends/`),
        apiFetch(`/api/social/friends/requests/incoming/`),
      ]);
      const friendsData = friendsRes.ok ? await friendsRes.json() : [];
      const incomingData = incomingRes.ok ? await incomingRes.json() : [];
      setFriends(friendsData);
      setIncoming(incomingData);
    } catch (error) {
      console.log('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await apiFetch(`/api/social/users/search/?q=${encodeURIComponent(query.trim())}`);
      const data = res.ok ? await res.json() : [];
      setSearchResults(data);
    } catch (e) {
      console.log('search error', e);
    }
  };

  const sendInvite = async (username) => {
    try {
      const res = await apiFetch(`/api/social/friends/requests/send/`, {
        method: 'POST',
        body: { to_username: username },
      });
      if (res.ok) Alert.alert('Sent', 'Friend request sent');
    } catch (e) {
      Alert.alert('Error', 'Failed to send request');
    }
  };

  const respondInvite = async (requestId, action) => {
    try {
      const res = await apiFetch(`/api/social/friends/requests/${requestId}/respond/`, {
        method: 'POST',
        body: { action },
      });
      if (res.ok) {
        loadContacts();
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to respond');
    }
  };

  const toggleShare = async (friendUsername, isActive) => {
    try {
      const res = await apiFetch(`/api/social/live-share/toggle/`, {
        method: 'POST',
        body: { viewer_username: friendUsername, is_active: isActive },
      });
      if (res.ok) Alert.alert('Updated', isActive ? 'Sharing enabled' : 'Sharing disabled');
    } catch (e) {
      Alert.alert('Error', 'Failed to update sharing');
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
          <Text style={styles.headerTitle}>Friends</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Incoming Requests */}
        {incoming.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Incoming Requests</Text>
            {incoming.map((req) => (
              <View key={req.id} style={styles.requestRow}>
                <Text style={styles.requestText}>{req.from_user?.username}</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => respondInvite(req.id, 'accept')}>
                    <Text style={styles.btnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => respondInvite(req.id, 'reject')}>
                    <Text style={styles.btnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Find Friends</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Search username"
              placeholderTextColor="#888"
              value={query}
              onChangeText={setQuery}
            />
            <TouchableOpacity style={styles.addButton} onPress={searchUsers}>
              <Text style={styles.addButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          {searchResults.map(u => (
            <View key={u.id} style={styles.resultRow}>
              <Text style={styles.resultText}>@{u.username}</Text>
              <TouchableOpacity style={styles.inviteBtn} onPress={() => sendInvite(u.username)}>
                <Text style={styles.btnText}>Invite</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Friends List */}
        {friends.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No friends yet</Text>
            <Text style={styles.emptyStateSubtext}>Search by username to add friends</Text>
          </View>
        ) : (
          friends.map((fr) => (
            <View key={fr.id} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>@{fr.friend?.username}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity style={styles.verifyButton} onPress={() => navigation.navigate('FriendDetail', { username: fr.friend?.username })}>
                  <Text style={styles.verifyButtonText}>Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={() => toggleShare(fr.friend?.username, true)}>
                  <Text style={styles.editButtonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => toggleShare(fr.friend?.username, false)}>
                  <Text style={styles.deleteButtonText}>Stop</Text>
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
