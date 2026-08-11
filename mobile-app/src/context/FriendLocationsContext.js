import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '../api/client';
import { parseApiListResponse } from '../utils/apiData';
import { fetchAndSyncUserLocation, normalizeCoordinatePair } from '../utils/location';

const normalizeFriendLocation = (item) => {
  const coordinates = normalizeCoordinatePair(item);
  if (!coordinates) return null;

  return {
    ...item,
    ...coordinates,
    lon: coordinates.longitude,
    lat: coordinates.latitude,
    user: item.user
      ? {
          ...item.user,
          avatar_url: item.user.avatar_url || item.user.avatarUrl || null,
        }
      : item.user,
  };
};

const FriendLocationsContext = createContext(null);

export const FriendLocationsProvider = ({ enabled, children }) => {
  const [friendLocations, setFriendLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const lastGoodFriends = useRef([]);
  const currentUserLocation = useRef(null);
  const currentUserProfile = useRef(null);

  useEffect(() => {
    currentUserLocation.current = userLocation;
  }, [userLocation]);

  useEffect(() => {
    currentUserProfile.current = userProfile;
  }, [userProfile]);

  const refreshFriends = useCallback(async () => {
    if (!enabled) return lastGoodFriends.current;
    try {
      const res = await apiFetch('/api/social/location/friends/');
      if (res.ok) {
        const list = await parseApiListResponse(res);
        const normalized = list.map(normalizeFriendLocation).filter(Boolean);
        if (__DEV__ && list.length > 0 && normalized.length === 0) {
          console.warn('[FriendLocations] Loaded friend locations but none had valid coordinates.');
        }
        lastGoodFriends.current = normalized;
        setFriendLocations(normalized);
        return normalized;
      }
    } catch (_) {}
    setFriendLocations(lastGoodFriends.current);
    return lastGoodFriends.current;
  }, [enabled]);

  const refreshProfile = useCallback(async () => {
    if (!enabled) return currentUserProfile.current;
    try {
      const res = await apiFetch('/api/accounts/profile/me/');
      if (res.ok) {
        const profile = await res.json();
        currentUserProfile.current = profile;
        setUserProfile(profile);
        return profile;
      }
    } catch (_) {}
    return currentUserProfile.current;
  }, [enabled]);

  const refreshUserLocation = useCallback(async (force = false) => {
    if (!enabled) return currentUserLocation.current;
    const region = await fetchAndSyncUserLocation(force);
    if (region) {
      currentUserLocation.current = region;
      setUserLocation(region);
    } else if (__DEV__) {
      console.warn('[FriendLocations] Could not resolve a current user location.');
    }
    return region || currentUserLocation.current;
  }, [enabled]);

  const refreshAll = useCallback(
    async (forceLocation = false) => {
      await Promise.all([refreshUserLocation(forceLocation), refreshFriends(), refreshProfile()]);
    },
    [refreshFriends, refreshProfile, refreshUserLocation],
  );

  useEffect(() => {
    if (!enabled) {
      setFriendLocations([]);
      setUserLocation(null);
      setUserProfile(null);
      return undefined;
    }

    refreshAll(true);
    const id = setInterval(() => refreshAll(false), 15000);
    return () => clearInterval(id);
  }, [enabled, refreshAll]);

  const enrichedUserLocation = useMemo(() => {
    if (!userLocation) return null;
    return {
      ...userLocation,
      avatarUrl: userProfile?.avatar_url || null,
      username: userProfile?.username || null,
      lat: userLocation.latitude,
      lon: userLocation.longitude,
    };
  }, [userLocation, userProfile]);

  const value = useMemo(
    () => ({
      friendLocations,
      userLocation: enrichedUserLocation,
      refreshFriends,
      refreshProfile,
      refreshUserLocation,
      refreshAll,
    }),
    [enrichedUserLocation, friendLocations, refreshAll, refreshFriends, refreshProfile, refreshUserLocation],
  );

  return (
    <FriendLocationsContext.Provider value={value}>
      {children}
    </FriendLocationsContext.Provider>
  );
};

export const useFriendLocations = () => {
  const ctx = useContext(FriendLocationsContext);
  if (!ctx) {
    return {
      friendLocations: [],
      userLocation: null,
      refreshFriends: async () => [],
      refreshProfile: async () => null,
      refreshUserLocation: async () => null,
      refreshAll: async () => {},
    };
  }
  return ctx;
};
