import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/api';

interface User {
  id: string;
  userId?: string | bigint;
  email: string;
  username?: string;
  name?: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER' | 'ANALYST';
  shops?: Array<{ id: string; name: string }>;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role?: 'BUYER' | 'SELLER';
  }) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  handleGoogleAuth: (role?: 'BUYER' | 'SELLER') => void;
  handleGoogleCallback: () => void;
  handleFacebookAuth: (role?: 'BUYER' | 'SELLER') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const AUTH_API_BASE = (() => {
  try {
    const url = new URL(API_BASE_URL);
    const normalizedPath = url.pathname.replace(/\/+$/, '');
    url.pathname = normalizedPath.endsWith('/api') ? normalizedPath : `${normalizedPath}/api`;
    return url.toString().replace(/\/+$/, '');
  } catch {
    return 'http://localhost:3000/api';
  }
})();

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for Google OAuth callback token on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tokenParam = urlParams.get('token');
    const errorParam = urlParams.get('error');

    if (tokenParam) {
      handleGoogleCallbackToken(tokenParam);
      // Clean up URL
      window.history.replaceState({}, '', location.pathname);
    } else if (errorParam) {
      setError(errorParam === 'google_auth_failed' ? 'Google authentication failed. Please try again.' : errorParam);
      setIsLoading(false);
      window.history.replaceState({}, '', location.pathname);
    } else {
      // Check for existing token
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        apiClient.setToken(storedToken);
        fetchUser();
      } else {
        setIsLoading(false);
      }
    }
  }, [location]);

  const fetchUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await apiClient.getMe();
      // Normalize user data structure
      const normalizedUser: User = {
        id: userData.id || userData.userId?.toString() || '',
        userId: userData.userId || userData.id,
        email: userData.email,
        username: userData.username,
        name: userData.name || userData.firstName,
        role: userData.role,
        shops: userData.shops || [],
        phoneNumber: userData.phoneNumber,
      };
      setUser(normalizedUser);
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      setError(error.message || 'Failed to fetch user');
      setToken(null);
      apiClient.setToken(null);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGoogleCallbackToken = useCallback(async (tokenParam: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setToken(tokenParam);
      apiClient.setToken(tokenParam);
      await fetchUser();
      // Redirect based on role
      const decoded = JSON.parse(atob(tokenParam.split('.')[1]));
      if (decoded.role === 'SELLER') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Failed to process Google OAuth token:', error);
      setError('Failed to process authentication token');
      setIsLoading(false);
    }
  }, [navigate, fetchUser]);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      // Server accepts email, but identifier can be email or username
      // Try as email first (server expects email)
      const response = await apiClient.login(identifier.trim(), password);
      setToken(response.token);
      apiClient.setToken(response.token);
      
      // Fetch full user data including shops
      const userData = await apiClient.getMe();
      
      // Normalize user data
      const normalizedUser: User = {
        id: userData.id || userData.userId?.toString() || '',
        userId: userData.userId || userData.id,
        email: userData.email,
        username: userData.username,
        name: userData.name || userData.firstName,
        role: userData.role,
        shops: userData.shops || [],
        phoneNumber: userData.phoneNumber,
      };
      setUser(normalizedUser);
      
      // Redirect based on role
      if (normalizedUser.role === 'SELLER') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (data: {
    username?: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role?: 'BUYER' | 'SELLER';
    name?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.register({
        ...data,
        name: data.name || data.username,
      });
      setToken(response.token);
      apiClient.setToken(response.token);
      
      // Fetch full user data including shops
      const userData = await apiClient.getMe();
      
      // Normalize user data
      const normalizedUser: User = {
        id: userData.id || userData.userId?.toString() || '',
        userId: userData.userId || userData.id,
        email: userData.email,
        username: userData.username,
        name: userData.name || userData.firstName,
        role: userData.role,
        shops: userData.shops || [],
        phoneNumber: userData.phoneNumber,
      };
      setUser(normalizedUser);
      
      // Redirect based on role
      if (normalizedUser.role === 'SELLER') {
        navigate('/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setError(error.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    apiClient.setToken(null);
    localStorage.removeItem('auth_token');
    navigate('/');
  }, [navigate]);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  }, []);

  const handleGoogleAuth = useCallback((role: 'BUYER' | 'SELLER' = 'BUYER') => {
    const currentUrl = window.location.origin;
    const state = encodeURIComponent(currentUrl);
    const googleAuthUrl = `${AUTH_API_BASE}/auth/google?state=${state}&role=${role}`;
    window.location.href = googleAuthUrl;
  }, []);

  const handleGoogleCallback = useCallback(() => {
    // This is handled in useEffect via URL params
    const urlParams = new URLSearchParams(location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      handleGoogleCallbackToken(tokenParam);
    }
  }, [location, handleGoogleCallbackToken]);

  const handleFacebookAuth = useCallback((role: 'BUYER' | 'SELLER' = 'BUYER') => {
    const currentUrl = window.location.origin;
    const state = encodeURIComponent(currentUrl);
    const facebookAuthUrl = `${AUTH_API_BASE}/auth/facebook?state=${state}&role=${role}`;
    window.location.href = facebookAuthUrl;
  }, []);

  const contextValue = useMemo(() => ({
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    error,
    login,
    register,
    logout,
    updateUser,
    handleGoogleAuth,
    handleGoogleCallback,
    handleFacebookAuth,
  }), [user, token, isLoading, error, login, register, logout, updateUser, handleGoogleAuth, handleGoogleCallback, handleFacebookAuth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

