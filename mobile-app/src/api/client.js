import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.0.100:8000'; // TODO: set to your API URL
const ACCESS_TOKEN_KEY = 'uvah_access_token';
const REFRESH_TOKEN_KEY = 'uvah_refresh_token';

export async function setTokens({ access, refresh }) {
  if (access) await AsyncStorage.setItem(ACCESS_TOKEN_KEY, access);
  if (refresh) await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export async function getAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function clearTokens() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function apiFetch(path, { method = 'GET', headers = {}, body } = {}) {
  const token = await getAccessToken();
  const finalHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

export { BASE_URL };

