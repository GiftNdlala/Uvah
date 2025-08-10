// SafeHood Mobile App - Main Entry Point
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';

const BASE_URL = 'http://192.168.0.100:8000'; // TODO: replace with your laptop LAN IP

async function postJson(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function App() {
  const [alert, setAlert] = useState(null);
  const [error, setError] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startSOS = async () => {
    setError('');
    try {
      const data = await postJson('/api/alerts', {
        severity_level: 2,
        trigger_count: 2,
        trigger_source: 'app',
      });
      setAlert(data);
      // Begin lightweight location pings (mocked here without native perms)
      timerRef.current = setInterval(async () => {
        try {
          // Replace with real geolocation later (Permissions + Geolocation API)
          const lat = -26.2041 + Math.random() * 0.001;
          const lon = 28.0473 + Math.random() * 0.001;
          await postJson(`/api/alerts/${data.id}/locations`, { lat, lon, accuracy: 20 });
        } catch (e) {}
      }, 3000);
    } catch (e) {
      setError(String(e.message || e));
    }
  };

  const cancelSOS = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setAlert(null);
  };

  const openWhatsApp = async () => {
    if (!alert) return;
    const text = encodeURIComponent(
      `SOS – I need help. Track me live: ${alert.share_url}`
    );
    const url = `whatsapp://send?text=${text}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) await Linking.openURL(url);
    else await Linking.openURL(`sms:&body=${text}`);
  };

  return (
    <View style={styles.container}>
      {!alert ? (
        <>
          <Text style={styles.title}>SafeHood</Text>
          <Text style={styles.subtitle}>Local dev build</Text>
          <TouchableOpacity style={styles.btn} onPress={startSOS}>
            <Text style={styles.btnText}>Start SOS</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.hint}>
            Ensure your phone can reach {BASE_URL} (same Wi‑Fi). Update the IP in App.js.
          </Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>SOS Active</Text>
          <Text style={styles.subtitle}>Share link:</Text>
          <Text style={styles.link}>{alert.share_url}</Text>
          <TouchableOpacity style={styles.btn} onPress={openWhatsApp}>
            <Text style={styles.btnText}>Share via WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={cancelSOS}>
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: { fontSize: 16, color: '#ccc', marginBottom: 8 },
  link: { color: '#6cf', marginBottom: 16, textAlign: 'center' },
  btn: {
    backgroundColor: '#e53935',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  cancel: { backgroundColor: '#444' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  error: { color: '#ff8a80', marginTop: 8 },
  hint: { color: '#aaa', marginTop: 12, textAlign: 'center' },
});