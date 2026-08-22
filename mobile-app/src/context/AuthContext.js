import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearTokens, restoreSession, setDemoMode } from '../api/client';
import { unregisterDeviceFromPush } from '../services/notificationService';
import { setSessionExpiredHandler } from './authSessionEvents';

const AuthContext = createContext(null);
const SESSION_RESTORE_TIMEOUT_MS = 15000;

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let acceptRestoreResult = true;

    const restoreTimeout = setTimeout(() => {
      if (!active) return;
      acceptRestoreResult = false;
      setIsAuthenticated(false);
      setIsLoading(false);
    }, SESSION_RESTORE_TIMEOUT_MS);

    const restore = async () => {
      try {
        const hasSession = await restoreSession();
        if (active && acceptRestoreResult) setIsAuthenticated(hasSession);
      } catch (_) {
        if (active && acceptRestoreResult) setIsAuthenticated(false);
      } finally {
        clearTimeout(restoreTimeout);
        if (active && acceptRestoreResult) setIsLoading(false);
      }
    };

    restore();
    return () => {
      active = false;
      clearTimeout(restoreTimeout);
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => setIsAuthenticated(false));
    return () => setSessionExpiredHandler(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await unregisterDeviceFromPush();
    } catch (_) {}
    await clearTokens();
    await setDemoMode(false);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, setIsAuthenticated, logout }),
    [isAuthenticated, isLoading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider.');
  return context;
};
