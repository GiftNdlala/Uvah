import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
const pendingNavigations = [];

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  } else {
    pendingNavigations.push({ name, params });
  }
}

export function flushPendingNavigations() {
  if (!navigationRef.isReady()) return;
  while (pendingNavigations.length) {
    const { name, params } = pendingNavigations.shift();
    navigationRef.navigate(name, params);
  }
}

export function reset(state) {
  if (navigationRef.isReady()) {
    navigationRef.reset(state);
  }
}
