import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthResponse, authService } from "@/services/auth.service";

export interface User {
  id: string;
  email: string;
  name?: string;
  shops?: Array<{
    id: string;
    name: string;
  }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  code: string;
  message: string;
  lockoutMinutes?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * SECURITY NOTE:
 * We are using localStorage to store the JWT token for demo purposes.
 * For production apps, consider:
 * 1. HttpOnly Cookies (prevents XSS attacks)
 * 2. Short-lived access tokens + Refresh tokens
 * 3. Storing tokens in memory (more secure but requires refresh on reload)
 */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-Login: Check for stored auth data on mount
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("auth_token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);

          // MIGRATION: Force re-login if user doesn't have shops array
          // This ensures users who logged in before the shops field was added will get fresh data
          if (!parsedUser.shops || !Array.isArray(parsedUser.shops)) {
            console.warn("User data missing shops array - forcing re-login");
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");
            setIsLoading(false);
            return;
          }

          // Optional: Validate token with backend
          // const isValid = await authService.validateToken(storedToken);
          // if (!isValid) { logout(); return; }

          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error);
        // Clear corrupted data
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);

      if (response.success && response.token) {
        // Store token and user data
        setToken(response.token);
        setUser(response.data);
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user", JSON.stringify(response.data));
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error: any) {
      // Re-throw to let the Login component handle specific errors
      throw error;
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    const response: AuthResponse = await authService.register({
      email,
      password,
      name,
    });

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
    // Clear state
    setToken(null);
    setUser(null);

    // Clear storage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");

    // Optional: Call backend to invalidate token
    authService.logout().catch((err) => {
      console.error("Logout error:", err);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
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
