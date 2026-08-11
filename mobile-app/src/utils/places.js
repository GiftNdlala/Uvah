import { ENV } from '../config/env';

const GOOGLE_MAPS_API_KEY = ENV?.GOOGLE_MAPS_API_KEY;
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

const QUERIES = {
  hotspots: (lat, lon) =>
    `[out:json][timeout:12];node(around:2000,${lat},${lon})[amenity~"cafe|restaurant|fast_food|community_centre|hospital|police|pharmacy"];out 10;`,
  nightlife: (lat, lon) =>
    `[out:json][timeout:12];node(around:2500,${lat},${lon})[amenity~"bar|pub|biergarten|nightclub"];out 12;`,
  events: (lat, lon) =>
    `[out:json][timeout:12];(node(around:3000,${lat},${lon})[amenity~"nightclub|cinema|theatre|arts_centre|events_venue"];way(around:3000,${lat},${lon})[amenity~"nightclub|cinema|theatre|arts_centre|events_venue"];);out center 10;`,
};

function elementToPlace(el, category) {
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (lat == null || lon == null) return null;

  const amenity = el.tags?.amenity || category;
  const label = el.tags?.name || el.tags?.brand || amenity.replace(/_/g, ' ');

  return {
    id: `${category}-${el.id}`,
    label: label.charAt(0).toUpperCase() + label.slice(1),
    latitude: lat,
    longitude: lon,
    category,
    color: category === 'nightlife' ? '#ff6b6b' : category === 'events' ? '#c77dff' : '#2aa8f2',
  };
}

async function fetchFromOverpass(lat, lon, category, signal) {
  const buildQuery = QUERIES[category] || QUERIES.hotspots;
  const query = buildQuery(lat, lon);

  const res = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`, { signal });
  if (!res.ok) throw new Error('Overpass service unavailable');

  const data = await res.json();
  return (data.elements || [])
    .map((el) => elementToPlace(el, category))
    .filter(Boolean);
}

async function fetchFromGoogle(lat, lon, category, signal) {
  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_API_KEY' || GOOGLE_MAPS_API_KEY.includes('change-me')) {
    throw new Error('Google Places API Key is missing or default');
  }

  const googleType = category === 'nightlife' ? 'bar' : category === 'events' ? 'tourist_attraction' : 'restaurant';
  const radius = category === 'nightlife' ? 2500 : category === 'events' ? 3000 : 2000;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radius}&type=${googleType}&key=${GOOGLE_MAPS_API_KEY}`;

  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Google Places API response error');

  const data = await res.json();
  if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
    throw new Error(`Google Places API Error: ${data.error_message || data.status}`);
  }

  return (data.results || []).map((item) => ({
    id: `${category}-${item.place_id}`,
    label: item.name,
    latitude: item.geometry.location.lat,
    longitude: item.geometry.location.lng,
    category,
    color: category === 'nightlife' ? '#ff6b6b' : category === 'events' ? '#c77dff' : '#2aa8f2',
  }));
}

export async function fetchNearbyPlaces(lat, lon, category = 'hotspots', signal) {
  let places = [];
  try {
    places = await fetchFromGoogle(lat, lon, category, signal);
  } catch (_) {
    try {
      places = await fetchFromOverpass(lat, lon, category, signal);
    } catch (err) {
      places = [];
    }
  }

  const unique = [];
  const seen = new Set();
  places.forEach((p) => {
    const key = `${p.latitude.toFixed(4)}:${p.longitude.toFixed(4)}:${p.label}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  });

  return unique.slice(0, 12);
}
