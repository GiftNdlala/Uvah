import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { apiFetch } from '../api/client';

const DEFAULT_REGION = {
  latitude: -26.2041,
  longitude: 28.0473,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

const SYNC_INTERVAL_MS = 15000;
let lastSyncAt = 0;
let cachedRegion = null;

export async function ensureLocationPermission() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Uvah Location Permission',
        message: 'Uvah needs your location to show you on the map and share with your trusted circle.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  const auth = await Geolocation.requestAuthorization('whenInUse');
  return auth === 'granted' || auth === 'limited';
}

export function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        // Fallback to low accuracy (Wi-Fi / Cellular) if GPS fails or times out (e.g. indoors)
        Geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            });
          },
          reject,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 10000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 },
    );
  });
}

export function coordsToRegion(coords, delta = 0.03) {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function normalizeCoordinatePair(point) {
  if (!point) return null;

  const latitude =
    point.latitude ??
    point.lat ??
    point.location?.latitude ??
    point.location?.lat ??
    point.latest_location?.latitude ??
    point.latest_location?.lat;
  const longitude =
    point.longitude ??
    point.lon ??
    point.lng ??
    point.location?.longitude ??
    point.location?.lon ??
    point.location?.lng ??
    point.latest_location?.longitude ??
    point.latest_location?.lon ??
    point.latest_location?.lng;

  const normalizedLatitude = Number(latitude);
  const normalizedLongitude = Number(longitude);

  if (!Number.isFinite(normalizedLatitude) || !Number.isFinite(normalizedLongitude)) {
    return null;
  }

  return {
    latitude: normalizedLatitude,
    longitude: normalizedLongitude,
  };
}

export async function fetchAndSyncUserLocation(force = false) {
  const allowed = await ensureLocationPermission();
  if (!allowed) return cachedRegion;

  const now = Date.now();
  if (!force && cachedRegion && now - lastSyncAt < SYNC_INTERVAL_MS) {
    return cachedRegion;
  }

  try {
    const coords = await getCurrentCoords();
    const region = coordsToRegion(coords);

    if (force || now - lastSyncAt >= SYNC_INTERVAL_MS) {
      try {
        const res = await apiFetch('/api/social/location/update/', {
          method: 'POST',
          body: {
            lat: coords.latitude,
            lon: coords.longitude,
            accuracy: coords.accuracy ?? null,
          },
        });
        if (res.ok) {
          lastSyncAt = now;
        }
      } catch (_) {}
    }

    cachedRegion = region;
    return region;
  } catch (_) {
    return cachedRegion;
  }
}

export function computeMapRegion(userLocation, friendLocations = [], fallback = DEFAULT_REGION) {
  const points = [];
  const normalizedUserLocation = normalizeCoordinatePair(userLocation);
  if (normalizedUserLocation) {
    points.push(normalizedUserLocation);
  }
  friendLocations.forEach((loc) => {
    const normalized = normalizeCoordinatePair(loc);
    if (normalized) {
      points.push(normalized);
    }
  });

  if (!points.length) return fallback;

  if (points.length === 1) {
    return {
      ...points[0],
      latitudeDelta: fallback.latitudeDelta,
      longitudeDelta: fallback.longitudeDelta,
    };
  }

  const lats = points.map((p) => p.latitude);
  const lons = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);
  const pad = 0.02;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad, 0.03),
    longitudeDelta: Math.max(maxLon - minLon + pad, 0.03),
  };
}

export { DEFAULT_REGION };
