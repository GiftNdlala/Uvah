import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import ScreenShell from '../../components/ScreenShell';
import { apiFetch } from '../../api/client';
import { parseApiList } from '../../utils/apiData';
import { palette, radius, typography } from '../../theme/tokens';

const AlertsScreen = ({ navigation }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadAlerts = async () => {
    try {
      const response = await apiFetch('/api/alerts/my-alerts/');
      if (response.ok) {
        const data = await response.json();
        setAlerts(parseApiList(data));
      } else {
        setAlerts([]);
      }
    } catch (_) {
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    if (filter === 'all') return alerts;
    if (filter === 'active') return alerts.filter((a) => a.status === 'active');
    return alerts.filter((a) => a.status !== 'active');
  }, [alerts, filter]);

  const cancelAlert = async (alertId) => {
    try {
      const response = await apiFetch(`/api/alerts/${alertId}/cancel/`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to cancel');
      setAlerts((prev) => prev.map((item) => (item.id === alertId ? { ...item, status: 'canceled' } : item)));
    } catch (_) {
      Alert.alert('Cancel failed', 'Could not cancel this alert right now.');
    }
  };

  const filterChip = (key, label) => (
    <TouchableOpacity
      key={key}
      style={[styles.chip, filter === key && styles.chipActive]}
      onPress={() => setFilter(key)}
    >
      <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenShell>
        <View style={styles.centered}>
          <ActivityIndicator color={palette.accent} />
          <Text style={styles.loadingText}>Loading alerts</Text>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <Text style={styles.title}>Alert Timeline</Text>
      <Text style={styles.subtitle}>Track active emergencies and check-ins in one stream.</Text>

      <View style={styles.chipsRow}>
        {filterChip('all', `All (${alerts.length})`)}
        {filterChip('active', `Active (${alerts.filter((a) => a.status === 'active').length})`)}
        {filterChip('done', `Done (${alerts.filter((a) => a.status !== 'active').length})`)}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAlerts(); }} tintColor={palette.accent} />}
      >
        {filteredAlerts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No alerts here yet</Text>
            <Text style={styles.emptySub}>Your future SOS and check-ins will appear in this timeline.</Text>
          </View>
        ) : (
          filteredAlerts.map((item) => {
            const isActive = item.status === 'active';
            return (
              <View style={styles.alertCard} key={item.id}>
                <View style={styles.alertTopRow}>
                  <View style={[styles.badge, { backgroundColor: isActive ? '#3a1f23' : '#1d3242' }]}>
                    <Text style={styles.badgeText}>{isActive ? 'ACTIVE' : 'COMPLETED'}</Text>
                  </View>
                  <Text style={styles.dateText}>{new Date(item.created_at).toLocaleString()}</Text>
                </View>

                <Text style={styles.alertMsg}>{item.message}</Text>
                {item.latest_location ? (
                  <Text style={styles.coordsText}>
                    Last point: {Number(item.latest_location.lat).toFixed(4)}, {Number(item.latest_location.lon).toFixed(4)}
                  </Text>
                ) : null}

                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => navigation.navigate('AlertDetail', { alert: item })}
                  >
                    <Icon name="document-text-outline" size={15} color={palette.text} />
                    <Text style={styles.smallBtnText}>Details</Text>
                  </TouchableOpacity>

                  {isActive ? (
                    <TouchableOpacity
                      style={[styles.smallBtn, styles.warnBtn]}
                      onPress={() => cancelAlert(item.id)}
                    >
                      <Icon name="close-circle-outline" size={15} color={palette.text} />
                      <Text style={styles.smallBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: palette.text,
  },
  title: {
    marginTop: 16,
    color: palette.text,
    fontSize: 30,
    fontFamily: typography.display,
  },
  subtitle: {
    color: palette.textMuted,
    marginTop: 4,
    marginBottom: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: '#173047',
    borderColor: '#36607d',
  },
  chipText: {
    color: palette.textMuted,
    fontSize: 12,
  },
  chipTextActive: {
    color: palette.text,
    fontFamily: typography.heading,
  },
  emptyCard: {
    marginTop: 22,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 18,
  },
  emptyTitle: {
    color: palette.text,
    fontFamily: typography.heading,
    fontSize: 18,
  },
  emptySub: {
    marginTop: 6,
    color: palette.textMuted,
  },
  alertCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    padding: 14,
    marginBottom: 10,
  },
  alertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: palette.text,
    fontSize: 11,
    fontFamily: typography.heading,
  },
  dateText: {
    color: palette.textMuted,
    fontSize: 11,
  },
  alertMsg: {
    marginTop: 10,
    color: palette.text,
    fontSize: 16,
    fontFamily: typography.heading,
  },
  coordsText: {
    marginTop: 5,
    color: palette.info,
    fontSize: 12,
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  smallBtn: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#173047',
  },
  warnBtn: {
    backgroundColor: '#552930',
    borderColor: '#8f3f4a',
  },
  smallBtnText: {
    color: palette.text,
    fontSize: 13,
    fontFamily: typography.heading,
  },
});

export default AlertsScreen;

