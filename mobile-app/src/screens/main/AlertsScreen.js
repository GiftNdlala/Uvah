import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AlertsScreen = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, completed

  const BASE_URL = 'http://192.168.0.100:8000'; // TODO: replace with your laptop LAN IP

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/alerts/my-alerts/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header with JWT token
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      } else {
        // For now, use mock data
        setAlerts([
          {
            id: 1,
            severity_level: 2,
            trigger_source: 'app',
            message: 'Emergency SOS activated',
            status: 'active',
            created_at: '2024-01-15T10:30:00Z',
            share_url: 'http://192.168.0.100:8000/live/abc123',
            locations: [
              { lat: -26.2041, lon: 28.0473, timestamp: '2024-01-15T10:30:00Z' }
            ]
          },
          {
            id: 2,
            severity_level: 1,
            trigger_source: 'checkin',
            message: 'Ngifikile! (I have arrived)',
            status: 'completed',
            created_at: '2024-01-14T15:45:00Z',
            share_url: 'http://192.168.0.100:8000/live/def456',
            locations: [
              { lat: -26.2041, lon: 28.0473, timestamp: '2024-01-14T15:45:00Z' }
            ]
          },
          {
            id: 3,
            severity_level: 2,
            trigger_source: 'app',
            message: 'Emergency SOS activated',
            status: 'completed',
            created_at: '2024-01-13T08:20:00Z',
            share_url: 'http://192.168.0.100:8000/live/ghi789',
            locations: [
              { lat: -26.2041, lon: 28.0473, timestamp: '2024-01-13T08:20:00Z' }
            ]
          },
        ]);
      }
    } catch (error) {
      console.log('Error loading alerts:', error);
      // Use mock data on error
      setAlerts([
        {
          id: 1,
          severity_level: 2,
          trigger_source: 'app',
          message: 'Emergency SOS activated',
          status: 'active',
          created_at: '2024-01-15T10:30:00Z',
          share_url: 'http://192.168.0.100:8000/live/abc123',
          locations: [
            { lat: -26.2041, lon: 28.0473, timestamp: '2024-01-15T10:30:00Z' }
          ]
        },
        {
          id: 2,
          severity_level: 1,
          trigger_source: 'checkin',
          message: 'Ngifikile! (I have arrived)',
          status: 'completed',
          created_at: '2024-01-14T15:45:00Z',
          share_url: 'http://192.168.0.100:8000/live/def456',
          locations: [
            { lat: -26.2041, lon: 28.0473, timestamp: '2024-01-14T15:45:00Z' }
          ]
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAlerts = () => {
    switch (filter) {
      case 'active':
        return alerts.filter(alert => alert.status === 'active');
      case 'completed':
        return alerts.filter(alert => alert.status === 'completed');
      default:
        return alerts;
    }
  };

  const getSeverityText = (level) => {
    switch (level) {
      case 1:
        return 'Check-in';
      case 2:
        return 'Emergency SOS';
      default:
        return 'Unknown';
    }
  };

  const getSeverityColor = (level) => {
    switch (level) {
      case 1:
        return '#2196f3';
      case 2:
        return '#e53935';
      default:
        return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'completed':
        return '#666';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewAlert = (alert) => {
    navigation.navigate('AlertDetail', { alert });
  };

  const handleShareAlert = (alert) => {
    const text = encodeURIComponent(
      `Alert: ${alert.message}\nTrack live: ${alert.share_url}`
    );
    
    try {
      Linking.openURL(`whatsapp://send?text=${text}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  const handleCancelAlert = (alert) => {
    if (alert.status !== 'active') return;
    
    Alert.alert(
      'Cancel Alert',
      'Are you sure you want to cancel this alert?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Cancel Alert', style: 'destructive', onPress: () => cancelAlert(alert.id) },
      ]
    );
  };

  const cancelAlert = async (alertId) => {
    try {
      const response = await fetch(`${BASE_URL}/api/alerts/${alertId}/cancel/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: Add Authorization header
        },
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, status: 'completed' } : alert
        ));
        Alert.alert('Success', 'Alert cancelled successfully');
      } else {
        Alert.alert('Error', 'Failed to cancel alert');
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
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const filteredAlerts = getFilteredAlerts();

  return (
    <SafeAreaView style={styles.container}>
      {/* Demo Mode Banner */}
      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>🚀 Demo Mode - Frontend Showcase</Text>
      </View>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alert History</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All ({alerts.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
          onPress={() => setFilter('active')}
        >
          <Text style={[styles.filterTabText, filter === 'active' && styles.filterTabTextActive]}>
            Active ({alerts.filter(a => a.status === 'active').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterTabText, filter === 'completed' && styles.filterTabTextActive]}>
            Completed ({alerts.filter(a => a.status === 'completed').length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No alerts found</Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all' 
                ? 'Your alert history will appear here'
                : `No ${filter} alerts found`
              }
            </Text>
          </View>
        ) : (
          filteredAlerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertInfo}>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity_level) }]}>
                    <Text style={styles.severityText}>
                      {getSeverityText(alert.severity_level)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(alert.status) }]}>
                    <Text style={styles.statusText}>
                      {getStatusText(alert.status)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.alertDate}>
                  {formatDate(alert.created_at)}
                </Text>
              </View>
              
              <Text style={styles.alertMessage}>{alert.message}</Text>
              
              {alert.locations && alert.locations.length > 0 && (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationText}>
                    📍 Last location: {alert.locations[0].lat.toFixed(4)}, {alert.locations[0].lon.toFixed(4)}
                  </Text>
                </View>
              )}
              
              <View style={styles.alertActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleViewAlert(alert)}
                >
                  <Text style={styles.actionButtonText}>View Details</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleShareAlert(alert)}
                >
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>
                
                {alert.status === 'active' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleCancelAlert(alert)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
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
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 4,
  },
  filterTabActive: {
    backgroundColor: '#6cf',
  },
  filterTabText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#111',
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
    textAlign: 'center',
  },
  alertCard: {
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
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alertInfo: {
    flexDirection: 'row',
    gap: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  alertDate: {
    color: '#ccc',
    fontSize: 12,
  },
  alertMessage: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationText: {
    color: '#6cf',
    fontSize: 14,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#e53935',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AlertsScreen;
