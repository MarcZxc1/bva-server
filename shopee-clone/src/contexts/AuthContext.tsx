import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient from '../services/api';

interface User {
  id: string;
  email: string;
  username?: string;
  name?: string;
  role: 'ADMIN' | 'SELLER' | 'BUYER' | 'ANALYST';
  shops?: Array<{ id: string; name: string }>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and fetch user
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      apiClient.setToken(storedToken);
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await apiClient.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setToken(null);
      apiClient.setToken(null);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (identifier: string, password: string) => {
    const response = await apiClient.login(identifier, password);
    setToken(response.token);
    apiClient.setToken(response.token);
    setUser(response.user);
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    phoneNumber?: string;
    role?: 'BUYER' | 'SELLER';
  }) => {
    const response = await apiClient.register(data);
    setToken(response.token);
    apiClient.setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    apiClient.setToken(null);
    localStorage.removeItem('auth_token');
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

