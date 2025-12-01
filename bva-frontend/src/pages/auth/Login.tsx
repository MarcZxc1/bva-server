import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth, LoginCredentials } from "@/contexts/AuthContext";
import { AxiosError } from "axios";
import { AlertCircle, Lock, Loader2 } from "lucide-react";

// --- Validation Schema ---
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// --- Error Types ---
interface ApiErrorResponse {
  error?: string;
  message?: string;
  code?: string;
  lockoutMinutes?: number;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading: authLoading, isAuthenticated } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutMinutes, setLockoutMinutes] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    // Clear previous errors
    setErrorMessage("");
    setIsLocked(false);
    setIsSubmitting(true);

    try {
      await login(data as LoginCredentials);
      toast.success("Login successful!");
      // Navigation is handled by the useEffect above
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const status = axiosError.response?.status;
      const errorData = axiosError.response?.data;
      const errorCode = errorData?.code;
      const message = errorData?.error || errorData?.message || "Login failed";

      // --- Handle Specific Error Cases ---

      // 1. Max Attempts / Account Locked (403 or 429)
      if (status === 403 || status === 429 || errorCode === "MAX_ATTEMPTS") {
        setIsLocked(true);
        const minutes = errorData?.lockoutMinutes || 30;
        setLockoutMinutes(minutes);
        setErrorMessage(
          `Too many failed login attempts. Your account is temporarily locked. Please try again in ${minutes} minutes.`
        );
        toast.error(`Account locked for ${minutes} minutes`, {
          duration: 5000,
        });
      }
      // 2. Invalid Credentials (401)
      else if (status === 401) {
        setErrorMessage("Invalid email or password. Please try again.");
        toast.error("Invalid credentials");
      }
      // 3. Generic Errors
      else {
        setErrorMessage(
          message || "An unexpected error occurred. Please try again."
        );
        toast.error(message || "Login failed");
      }

      console.error("Login error:", axiosError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/bva-logo.png"
              alt="BVA Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Business Virtual Assistant
          </h1>
          <p className="text-muted-foreground">
            AI-powered inventory & marketing automation
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to manage your e-commerce business
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Account Locked Alert */}
            {isLocked && (
              <Alert variant="destructive" className="mb-4">
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Account Temporarily Locked</strong>
                  <p className="mt-1 text-sm">{errorMessage}</p>
                </AlertDescription>
              </Alert>
            )}

            {/* Generic Error Alert */}
            {errorMessage && !isLocked && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seller@example.com"
                  {...register("email")}
                  disabled={isSubmitting || isLocked}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isSubmitting || isLocked}
                  className={errors.password ? "border-destructive" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || authLoading || isLocked}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {/* Demo Note */}
              <div className="text-center text-sm text-muted-foreground">
                Demo: Use any email and password to login
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          &copy; 2025 Virtual Business Assistant. All rights reserved.
        </div>
      </div>
    </div>
  );
}
