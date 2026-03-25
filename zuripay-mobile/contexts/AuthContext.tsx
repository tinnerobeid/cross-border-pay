import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserOut, getCurrentUser } from '../services/api';

const TOKEN_KEY = 'zuripay_token';

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
        // Validate the token is still accepted by the server
        const me = await getCurrentUser(stored);
        setToken(stored);
        setUser(me);
      } catch {
        // Token expired or invalid — clear it so the user sees the login screen
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
