'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, authenticateWithSiwe, logoutFromSiwe, getCurrentUser } from '../lib/wallet';

interface AuthContextType {
  authState: AuthState;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    address: null,
    token: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      getCurrentUser(token)
        .then((user) => {
          setAuthState({
            isAuthenticated: true,
            address: user.address,
            token,
          });
        })
        .catch(() => {
          // Token is invalid, remove it
          localStorage.removeItem('auth_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async () => {
    try {
      setLoading(true);
      const result = await authenticateWithSiwe();
      setAuthState(result);
      if (result.token) {
        localStorage.setItem('auth_token', result.token);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (authState.token) {
        await logoutFromSiwe(authState.token);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        address: null,
        token: null,
      });
      localStorage.removeItem('auth_token');
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
