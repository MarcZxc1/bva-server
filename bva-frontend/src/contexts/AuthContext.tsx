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
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response: AuthResponse = await authApi.login({ email, password });
    
    if (response.success && response.token) {
      // For manual login, we already have user data from response
      const userData: User = {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        shops: response.data.shops || []
      };
      
      setToken(response.token);
      setUser(userData);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      throw new Error("Login failed");
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const response: AuthResponse = await authApi.register({ email, password, name });
    
    if (response.success && response.token) {
      // For manual register, we already have user data from response
      const userData: User = {
        id: response.data.id,
        email: response.data.email,
        name: response.data.name,
        shops: response.data.shops || []
      };
      
      setToken(response.token);
      setUser(userData);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      throw new Error("Registration failed");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
  };

  // Set token from external source (e.g., Google OAuth callback)
  const setAuthToken = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("auth_token", newToken);
    
    // Fetch full user details from backend
    try {
      const response = await authApi.getCurrentUser();
      if (response.success && response.data) {
        const userData: User = {
          id: response.data.id,
          email: response.data.email,
          name: response.data.name,
          shops: response.data.shops,
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        // Fallback: decode JWT to get basic user info
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        const basicUser: User = {
          id: payload.userId,
          email: payload.email || "user@example.com",
          name: payload.name || "User",
        };
        setUser(basicUser);
        localStorage.setItem("user", JSON.stringify(basicUser));
      }
    } catch (e) {
      console.error("Failed to fetch user details:", e);
      // Fallback: decode JWT to get basic user info
      try {
        const payload = JSON.parse(atob(newToken.split('.')[1]));
        const basicUser: User = {
          id: payload.userId,
          email: payload.email || "user@example.com",
          name: payload.name || "User",
        };
        setUser(basicUser);
        localStorage.setItem("user", JSON.stringify(basicUser));
      } catch (decodeError) {
        console.error("Failed to decode token:", decodeError);
      }
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


