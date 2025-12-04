import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AxiosError } from "axios";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ error?: string }>;
      toast.error(
        axiosError.response?.data?.error || 
        axiosError.message || 
        "Login failed. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
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

        {/* Login Card - Centered Glass Card */}
        <Card className="glass-card shadow-card">
          <CardHeader className="border-b border-card-glass-border">
            <CardTitle className="text-foreground">👋 Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground">Sign in to manage your e-commerce business</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seller@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-card-sm border-card-glass-border focus:ring-primary/20"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

              <div className="text-center text-sm text-muted-foreground glass-card-sm p-3 rounded-md">
                Demo: Use any email and password to login
              </div>
            </form>
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
