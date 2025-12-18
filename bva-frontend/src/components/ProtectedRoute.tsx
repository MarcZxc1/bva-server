import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, token, user } = useAuth();
  const [initTimeout, setInitTimeout] = useState(false);

  // Wait for AuthContext to initialize (max 1 second)
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitTimeout(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Check localStorage directly as source of truth (this is the most reliable)
  const savedToken = localStorage.getItem("auth_token");
  const savedUser = localStorage.getItem("user");
  const hasLocalAuth = !!(savedToken && savedUser);
  const hasStateAuth = isAuthenticated || (token && user);
  const isAuth = hasLocalAuth || hasStateAuth;

  useEffect(() => {
    console.log("🔒 [ProtectedRoute] Auth check:", {
      isAuthenticated,
      isLoading,
      initTimeout,
      hasToken: !!token,
      hasUser: !!user,
      hasLocalToken: !!savedToken,
      hasLocalUser: !!savedUser,
      hasLocalAuth,
      hasStateAuth,
      isAuth,
      currentPath: window.location.pathname,
      tokenPreview: token ? token.substring(0, 20) + "..." : null,
      userPreview: user ? { id: user.id, email: user.email } : null,
      savedUserPreview: savedUser ? JSON.parse(savedUser) : null,
    });
  }, [isAuthenticated, isLoading, initTimeout, token, user, savedToken, savedUser, hasLocalAuth, hasStateAuth, isAuth]);

  // Show loading while AuthContext is initializing (but not forever)
  if (isLoading && !initTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If we have auth in localStorage, allow access even if state hasn't updated
  // This handles the OAuth flow where state might not be ready yet
  if (hasLocalAuth) {
    console.log("✅ ProtectedRoute: Auth found in localStorage, allowing access");
    return <>{children}</>;
  }

  // If no auth found anywhere, redirect to home
  if (!isAuth) {
    console.log("❌ ProtectedRoute: Not authenticated, redirecting to /");
    return <Navigate to="/" replace />;
  }

  console.log("✅ ProtectedRoute: Authentication confirmed, rendering children");
  return <>{children}</>;
}


