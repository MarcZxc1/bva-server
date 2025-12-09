import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, AuthResponse } from "@/lib/api";

interface Shop {
  id: string;
  name: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  shops?: Shop[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for stored token and user
      const storedToken = localStorage.getItem("auth_token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        refreshUserData(storedToken, true);
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth().finally(() => {
      setIsLoading(false);
    });
  }, []);

  // Function to refresh user data from backend
  // setLoading: if true, will set isLoading to false when done (for initial mount)
  // skipIfExists: if true, skip API call if user already has shops (prevents infinite loops)
  const refreshUserData = async (authToken: string, setLoading: boolean = false, skipIfExists: boolean = false) => {
    // Skip if user already has shops and skipIfExists is true (prevents unnecessary API calls)
    if (skipIfExists && user?.shops && user.shops.length > 0) {
      console.log("⏭️  Skipping refresh - user already has shops");
      if (setLoading) {
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        const userData: User = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          shops: response.data.shops || [], // Ensure shops array exists
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        console.log("✅ User data refreshed with shops:", userData.shops?.length || 0);
      } else {
        console.warn("⚠️  getCurrentUser returned no data, using token data");
        // Don't update user if API fails - keep existing user data
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // Don't update user on error - keep existing user data from token
    } finally {
      if (setLoading) {
        setIsLoading(false);
      }
    }
  };

  const login = async (email: string, password: string) => {
    const response: AuthResponse = await authApi.login({ email, password });
    
    if (response.success && response.token) {
      // Set token immediately
      setToken(response.token);
      localStorage.setItem("auth_token", response.token);
      
      // Set user data immediately from response (if available) to allow navigation
      if (response.data) {
        const userData: User = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          shops: response.data.shops || [],
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
      
      // Ensure isLoading is false so ProtectedRoute allows navigation
      setIsLoading(false);
      
      // Refresh user data in background to get latest shops (non-blocking)
      refreshUserData(response.token, false).catch((error) => {
        console.error("Failed to refresh user data:", error);
        // Don't throw - we already have user data from response
      });
    } else {
      throw new Error("Login failed");
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const response: AuthResponse = await authApi.register({ email, password, name });
    
    if (response.success && response.token) {
      // Set token immediately
      setToken(response.token);
      localStorage.setItem("auth_token", response.token);
      
      // Set user data immediately from response (if available) to allow navigation
      if (response.data) {
        const userData: User = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          shops: response.data.shops || [],
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      }
      
      // Ensure isLoading is false so ProtectedRoute allows navigation
      setIsLoading(false);
      
      // Refresh user data in background to get latest shops (non-blocking)
      refreshUserData(response.token, false).catch((error) => {
        console.error("Failed to refresh user data:", error);
        // Don't throw - we already have user data from response
      });
    } else {
      throw new Error("Registration failed");
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  };

  // Set token from external source (e.g., Google OAuth callback)
  const setAuthToken = async (newToken: string) => {
    // Decode token first to get user info
    let basicUser: User | null = null;
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      basicUser = {
        id: payload.userId,
        email: payload.email || "user@example.com",
        name: payload.name || "User",
        shops: payload.shops || [], // Shops are included in JWT from OAuth
      };
    } catch (decodeError) {
      console.error("Failed to decode token:", decodeError);
    }
    
    // Set state synchronously in the correct order
    // 1. Set token
    setToken(newToken);
    localStorage.setItem("auth_token", newToken);
    
    // 2. Set user (this makes isAuthenticated true)
    if (basicUser) {
      setUser(basicUser);
      localStorage.setItem("user", JSON.stringify(basicUser));
      console.log("✅ OAuth user set with shops:", basicUser.shops?.length || 0);
    }
    
    // 3. Set loading to false AFTER both token and user are set
    setIsLoading(false);
    
    // Refresh user data in background to get latest shops from backend
    // Skip if user already has shops to prevent infinite loops
    // Use a small delay to avoid immediate API call during navigation
    setTimeout(() => {
      refreshUserData(newToken, false, true).catch((error) => {
        console.error("Failed to refresh user data after OAuth:", error);
        // Don't throw - we already have basic user data from token
      });
    }, 1000); // Delay to let navigation complete first
  };

  // Public function to refresh user data (can be called from components)
  const refreshUser = async () => {
    if (token) {
      await refreshUserData(token, false, false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        setToken: setAuthToken,
        refreshUser,
        isAuthenticated: !!token && !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


