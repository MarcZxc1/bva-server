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
  handleFacebookCallback: () => void;
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

// Get base URL and ensure it doesn't end with /api to avoid double /api/api
const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Remove trailing /api if present to avoid double /api/api in endpoints
  return url.replace(/\/api\/?$/, '');
};
const API_BASE_URL = getApiBaseUrl();

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle OAuth callback and check for existing sessions
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(location.search);
      const tokenParam = urlParams.get('token');
      const errorParam = urlParams.get('error');
      const errorDetails = urlParams.get('details');

      if (tokenParam) {
        console.log('🔵 Processing OAuth token from URL...');
        await handleGoogleCallbackToken(tokenParam);
        // Clean up URL - remove token parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('token');
        window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
      } else if (errorParam) {
        // Get detailed error message if available
        const errorMessage = errorParam === 'google_auth_failed' 
          ? (errorDetails ? `Google authentication failed: ${decodeURIComponent(errorDetails)}` : 'Google authentication failed. Please try again.')
          : (errorDetails ? `${errorParam}: ${decodeURIComponent(errorDetails)}` : errorParam);
        console.error('❌ Google OAuth error:', errorParam, errorDetails);
        setError(errorMessage);
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
    };

    handleOAuthCallback();
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
      console.log('🔵 Processing Google OAuth token...');
      
      if (!tokenParam || !tokenParam.trim()) {
        throw new Error('Invalid token received');
      }
      
      // Clear any existing token first to prevent conflicts
      const oldToken = localStorage.getItem('auth_token');
      if (oldToken && oldToken !== tokenParam) {
        console.log('🔄 Replacing old token with new OAuth token');
        localStorage.removeItem('auth_token');
        apiClient.setToken(null);
      }
      
      setToken(tokenParam);
      apiClient.setToken(tokenParam);
      localStorage.setItem('auth_token', tokenParam);
      
      // Fetch user data to get role
      const userData = await apiClient.getMe();
      
      if (!userData) {
        throw new Error('Failed to fetch user data after authentication');
      }
      
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
      
      console.log('✅ OAuth user set with role:', normalizedUser.role);
      
      // Redirect based on role - different pages for buyer vs seller
      if (normalizedUser.role === 'SELLER') {
        console.log('🚀 Redirecting SELLER to /dashboard');
        navigate('/dashboard');
      } else {
        console.log('🚀 Redirecting BUYER to landing page (/)');
        navigate('/'); // Buyer landing page
      }
    } catch (error: any) {
      console.error('❌ Failed to process Google OAuth token:', error);
      const errorMessage = error.message || 'Failed to process authentication token. Please try again.';
      setError(errorMessage);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      apiClient.setToken(null);
      setToken(null);
      setIsLoading(false);
      // Don't throw - let the error be displayed to the user
    }
  }, [navigate]);

  const login = useCallback(async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔵 Attempting login for:', identifier);
      
      // Server accepts email, but identifier can be email or username
      // Try as email first (server expects email)
      const response = await apiClient.login(identifier.trim(), password);
      
      if (!response || !response.token) {
        throw new Error('Invalid response from server: missing token');
      }
      
      setToken(response.token);
      apiClient.setToken(response.token);
      
      // Fetch full user data including shops
      const userData = await apiClient.getMe();
      
      if (!userData) {
        throw new Error('Failed to fetch user data after login');
      }
      
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
      
      console.log('✅ Login successful, user role:', normalizedUser.role);
      
      // Redirect based on role - buyers go to landing page, sellers go to dashboard
      if (normalizedUser.role === 'SELLER') {
        console.log('🚀 Redirecting SELLER to /dashboard');
        navigate('/dashboard');
      } else {
        console.log('🚀 Redirecting BUYER to landing page (/)');
        navigate('/');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
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
      console.log('🔵 Registering user with role:', data.role || 'BUYER');
      
      const response = await apiClient.register({
        ...data,
        name: data.name || data.username,
      });
      
      if (!response || !response.token) {
        throw new Error('Invalid response from server: missing token');
      }
      
      setToken(response.token);
      apiClient.setToken(response.token);
      
      // Fetch full user data including shops
      const userData = await apiClient.getMe();
      
      if (!userData) {
        throw new Error('Failed to fetch user data after registration');
      }
      
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
      
      console.log('✅ Registration successful, user role:', normalizedUser.role);
      
      // Redirect based on role - buyers go to landing page (/), sellers go to dashboard
      if (normalizedUser.role === 'SELLER') {
        console.log('🚀 Redirecting SELLER to /dashboard');
        navigate('/dashboard');
      } else {
        console.log('🚀 Redirecting BUYER to landing page (/)');
        navigate('/');
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const errorMessage = error.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
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
    // Use base origin only (not the full path) to avoid redirect URL validation issues
    // The server will handle the final redirect based on role
    const baseUrl = window.location.origin;
    const state = encodeURIComponent(JSON.stringify({ 
      redirectUrl: baseUrl,
      role 
    }));
    // Use /api/auth/google endpoint (mounted at /api/auth in server)
    const googleAuthUrl = `${API_BASE_URL}/api/auth/google?state=${state}&role=${role}`;
    console.log('🔵 Initiating Google OAuth, redirecting to:', googleAuthUrl);
    // Clear any existing tokens to prevent reuse issues
    localStorage.removeItem('auth_token');
    apiClient.setToken(null);
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

  const handleFacebookAuth = useCallback(async (_role: 'BUYER' | 'SELLER' = 'BUYER') => {
    // Facebook OAuth is not currently supported without Supabase
    // Users can use Google OAuth instead
    const errorMsg = 'Facebook OAuth is not currently available. Please use Google OAuth instead.';
    console.error('❌', errorMsg);
    setError(errorMsg);
    alert(errorMsg);
  }, []);

  const handleFacebookCallback = useCallback(() => {
    // This is handled in useEffect via URL params (same as Google)
    const urlParams = new URLSearchParams(location.search);
    const tokenParam = urlParams.get('token');
    if (tokenParam) {
      handleGoogleCallbackToken(tokenParam); // Reuse same handler
    }
  }, [location, handleGoogleCallbackToken]);

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
    handleFacebookCallback,
  }), [user, token, isLoading, error, login, register, logout, updateUser, handleGoogleAuth, handleGoogleCallback, handleFacebookAuth, handleFacebookCallback]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

