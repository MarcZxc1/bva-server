import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AxiosError } from "axios";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";

// Google Icon SVG Component
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Backend URL for Google OAuth
const RAW_BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const BACKEND_API_BASE = (() => {
  try {
    const url = new URL(RAW_BACKEND_URL);
    const normalizedPath = url.pathname.replace(/\/+$/, "");
    url.pathname = normalizedPath.endsWith("/api") ? normalizedPath : `${normalizedPath}/api`;
    return url.toString().replace(/\/+$/, "");
  } catch {
    return "http://localhost:3000/api";
  }
})();

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, register, setToken, isLoading, isAuthenticated } = useAuth();
  
  // Track OAuth processing to prevent infinite loops
  const oauthProcessedRef = useRef(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Register form state
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Redirect to dashboard if already authenticated (but not if processing OAuth callback)
  useEffect(() => {
    const hasToken = searchParams.has("token");
    const hasError = searchParams.has("error");
    
    // Only redirect if authenticated, no OAuth params, and not processing OAuth
    if (isAuthenticated && !hasToken && !hasError && !oauthProcessedRef.current) {
      console.log("✅ Already authenticated, redirecting to dashboard...");
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, searchParams, navigate]);

  // Handle token from Google OAuth callback - SINGLE EFFECT, NO LOOPS
  useEffect(() => {
    // Prevent re-processing if already handled
    if (oauthProcessedRef.current) {
      return;
    }

    const token = searchParams.get("token");
    const error = searchParams.get("error");

    // Process token only once
    if (token && !oauthProcessedRef.current) {
      oauthProcessedRef.current = true; // Mark as processed immediately
      
      const processToken = async () => {
        try {
          console.log("🔑 Processing OAuth token...");
          
          // Remove token from URL immediately to prevent re-processing
          setSearchParams({}, { replace: true });
          
          // Save token and fetch user data
          await setToken(token);
          console.log("✅ Token saved and user data loaded");
          toast.success("Google login successful!");
          
          // Navigate after a brief delay to ensure state is updated
          setTimeout(() => {
            console.log("🚀 Navigating to dashboard...");
            navigate("/dashboard", { replace: true });
          }, 200);
        } catch (err) {
          console.error("OAuth token error:", err);
          toast.error("Failed to complete login. Please try again.");
          oauthProcessedRef.current = false; // Reset on error
          setSearchParams({}, { replace: true }); // Clear URL
        }
      };
      
      processToken();
      return;
    }

    // Process error only once
    if (error && !oauthProcessedRef.current) {
      oauthProcessedRef.current = true; // Mark as processed
      
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Google authentication failed. Please try again.",
        no_user: "Could not retrieve user information.",
        token_generation_failed: "Failed to generate authentication token.",
      };
      toast.error(errorMessages[error] || "Authentication error occurred.");
      
      // Clear error from URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setToken, navigate, setSearchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error("Please enter email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      toast.error(
        axiosError.response?.data?.error || 
        axiosError.response?.data?.message ||
        axiosError.message || 
        "Login failed. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (registerPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (registerPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await register(registerEmail, registerPassword, registerName);
      toast.success("Registration successful! Welcome to BVA!");
      navigate("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string; message?: string }>;
      toast.error(
        axiosError.response?.data?.error || 
        axiosError.response?.data?.message ||
        axiosError.message || 
        "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // We pass the frontend's origin as the 'state' parameter.
    // The backend will use this to redirect the user back to the correct application.
    const state = window.location.origin;
    window.location.href = `${BACKEND_API_BASE}/auth/google?state=${state}`;
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative" style={{ background: 'var(--background-gradient)' }}>
      {/* Back to Landing Page Button - Upper Left Corner (Subtle) */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-smooth opacity-60 hover:opacity-100"
          size="sm"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-sm">Back to Home</span>
        </Button>
      </div>

      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 glass-card-sm flex items-center justify-center p-2">
              <img src="/bva-logo.svg" alt="BVA Logo" className="h-full w-full object-contain" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Business Virtual Assistant</h1>
          <p className="text-muted-foreground">AI-powered inventory & marketing automation</p>
        </div>

        {/* Auth Card with Tabs */}
        <Card className="glass-card shadow-card">
          <CardHeader className="border-b border-card-glass-border pb-4">
            <CardTitle className="text-foreground">
              {activeTab === "login" ? "👋 Welcome Back" : "🚀 Get Started"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {activeTab === "login" 
                ? "Sign in to manage your e-commerce business" 
                : "Create an account to start automating your business"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-foreground font-medium">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seller@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="glass-card-sm border-card-glass-border focus:ring-primary/20"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-foreground font-medium">
                      <Lock className="inline h-4 w-4 mr-1" />
                      Password
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="glass-card-sm border-card-glass-border focus:ring-primary/20"
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 h-11 rounded-md shadow-nav-active" 
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-foreground font-medium">
                      <User className="inline h-4 w-4 mr-1" />
                      Full Name
                    </Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="John Doe"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="glass-card-sm border-card-glass-border focus:ring-primary/20"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-foreground font-medium">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Email
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seller@example.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="glass-card-sm border-card-glass-border focus:ring-primary/20"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-foreground font-medium">
                      <Lock className="inline h-4 w-4 mr-1" />
                      Password
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="glass-card-sm border-card-glass-border focus:ring-primary/20"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-foreground font-medium">
                      <Lock className="inline h-4 w-4 mr-1" />
                      Confirm Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="glass-card-sm border-card-glass-border focus:ring-primary/20"
                      required
                      minLength={6}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 h-11 rounded-md shadow-nav-active" 
                    disabled={isSubmitting || isLoading}
                  >
                    {isSubmitting ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-card-glass-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Google Sign-in Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 glass-card-sm border-card-glass-border hover:bg-primary/5 transition-smooth"
              onClick={handleGoogleLogin}
              disabled={isSubmitting || isLoading}
            >
              <GoogleIcon />
              Sign in with Google
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>🔗 Connect Shopee • Lazada • TikTok Shop</p>
        </div>
      </div>
    </div>
  );
}
