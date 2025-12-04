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
      setToken(response.token);
      setUser(response.data);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(response.data));
    } else {
      throw new Error("Login failed");
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const response: AuthResponse = await authApi.register({ email, password, name });
    
    if (response.success && response.token) {
      setToken(response.token);
      setUser(response.data);
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user", JSON.stringify(response.data));
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
  const setAuthToken = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("auth_token", newToken);
    
    // Decode JWT to get user info (basic decode, not verification)
    try {
      const payload = JSON.parse(atob(newToken.split('.')[1]));
      const basicUser: User = {
        id: payload.userId,
        email: payload.email || "google-user@example.com",
        name: payload.name || "Google User",
      };
      setUser(basicUser);
      localStorage.setItem("user", JSON.stringify(basicUser));
    } catch (e) {
      console.error("Failed to decode token:", e);
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


