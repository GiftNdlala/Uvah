import { BASE_URL } from '../api/client';

export function resolveMediaUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const localhostRegex = /https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:\d+)?/i;
    if (localhostRegex.test(url)) {
      const baseOrigin = BASE_URL.replace(/\/$/, '');
      return url.replace(localhostRegex, baseOrigin);
    }
    return url;
  }
  const base = BASE_URL.replace(/\/$/, '');
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base}${path}`;
}
