import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// API Base URL - BVA Server for OAuth, or Shopee-Clone backend
const BVA_API_URL = import.meta.env.VITE_BVA_API_URL || 'http://localhost:3000';

interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  shopeeId?: string;
  googleId?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setAuthFromToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
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

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('shopee_token');
      if (storedToken) {
        try {
          await setAuthFromToken(storedToken);
        } catch (error) {
          console.error('Failed to restore auth:', error);
          localStorage.removeItem('shopee_token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Check for OAuth callback token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const callbackToken = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (callbackToken) {
      setAuthFromToken(callbackToken)
        .then(() => {
          // Clean up URL after successful auth
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .catch((error) => {
          console.error('Failed to set auth from callback token:', error);
        });
    }
  }, []);

  const setAuthFromToken = async (newToken: string): Promise<void> => {
    try {
      // Fetch user profile with the token
      const response = await fetch(`${BVA_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${newToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setUser(data.data);
        setToken(newToken);
        localStorage.setItem('shopee_token', newToken);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('setAuthFromToken error:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BVA_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.success && data.data) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('shopee_token', data.data.token);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = (): void => {
    // Redirect to BVA's Google OAuth endpoint
    // The callback will redirect back to this app with a token
    window.location.href = `${BVA_API_URL}/api/auth/google`;
  };

  const register = async (email: string, password: string, name?: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BVA_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          name,
          role: 'SELLER' // Default role for Shopee sellers
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.success && data.data) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('shopee_token', data.data.token);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('shopee_token');
    localStorage.removeItem('demoUser');
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    loginWithGoogle,
    register,
    logout,
    setAuthFromToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
