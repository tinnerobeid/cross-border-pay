import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserOut, getCurrentUser } from '../services/api';

const TOKEN_KEY = 'halisi_token';

interface AuthContextType {
  token: string | null;
  user: UserOut | null;
  setAuth: (token: string, user: UserOut) => Promise<void>;
  clearAuth: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserOut | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (!stored) return;
        // Trust the stored token without a network round-trip; individual
        // API calls will fail with 401 if it has expired, at which point
        // clearAuth() should be called.
        setToken(stored);
        // Fetch the user profile in the background — don't block startup.
        getCurrentUser(stored)
          .then((me) => setUser(me))
          .catch(async () => {
            await AsyncStorage.removeItem(TOKEN_KEY);
            setToken(null);
            setUser(null);
          });
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const setAuth = async (newToken: string, newUser: UserOut) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const clearAuth = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, setAuth, clearAuth, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
