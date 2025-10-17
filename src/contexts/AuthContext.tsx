import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      verifyToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      console.log('[Auth] 🔍 Verifying stored token for auto-login...');
      const response = await authApi.verifyToken();
      if (response.success && response.user) {
        setUser(response.user);
        console.log('[Auth] ✅ Auto-login successful:', response.user.username);
      } else {
        // Invalid token, clear it
        console.log('[Auth] ❌ Token invalid, clearing storage');
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('[Auth] Token verification failed:', error);
      localStorage.removeItem('authToken');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.token) {
        setToken(response.token);
        setUser(response.user);
        localStorage.setItem('authToken', response.token);
        console.log('[Auth] ✅ Login successful, token persisted for auto-login');
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      console.error('[Auth] Login error:', error);
      throw error;
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      const response = await authApi.signup(email, username, password);
      if (response.success && response.token) {
        setToken(response.token);
        setUser(response.user);
        // Persist token for auto-login across browser sessions
        localStorage.setItem('authToken', response.token);
        console.log('[Auth] ✅ Auto-login enabled - token saved to localStorage');
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error) {
      console.error('[Auth] Signup error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
