import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  Users,
  Zap,
  Shield,
  ArrowRight,
  Search,
  Moon,
  Sun
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen" style={{ background: 'var(--background-gradient)' }}>
      {/* Navigation Bar - Glass Effect */}
      <nav className="sticky top-4 z-50 glass-card-sm mx-4 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="BVA Logo" className="h-16 w-16 object-contain" />
            <span className="font-bold text-xl text-foreground">Business VA</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {/* Features and Services Links */}
            <div className="hidden md:flex gap-6">
              <a href="#features" className="text-foreground font-medium text-sm">Features</a>
              <a href="#services" className="text-foreground font-medium text-sm">Services</a>
            </div>
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-md text-foreground hover:bg-primary/10 glass-card-sm"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-nav-active" onClick={() => navigate("/login")}>
              Sign up
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge className="w-fit bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium rounded-full">
              🚀 Smart Business Automation
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Your AI-Powered Business Assistant
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Automate inventory management, sales forecasting, and marketing campaigns. Get real-time insights to scale your business faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-nav-active" onClick={() => navigate("/login")}>
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-card-glass-border text-foreground hover:bg-primary/10 glass-card-sm">
                Watch Demo
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div>
                <p className="text-2xl font-bold text-primary">1</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">99.9%</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground">Support</p>
              </div>
            </div>
          </div>

          {/* Hero Cards - Glass Effect */}
          <div className="space-y-6">
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 glass-card-sm flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">SmartShelf</p>
                  <p className="text-sm text-muted-foreground">Real-time tracking</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 glass-card-sm flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Restock Planner</p>
                  <p className="text-sm text-muted-foreground">AI predictions</p>
                </div>
              </div>
            </div>
            <div className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 glass-card-sm flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">MarketMate</p>
                  <p className="text-sm text-muted-foreground">Campaign automation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <Badge className="bg-primary text-primary-foreground border-primary mb-4 font-bold px-4 py-1.5">FEATURES</Badge>
          <h2 className="text-4xl font-bold text-foreground mb-4">Powerful Tools for Modern Businesses</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to manage, automate, and scale your business operations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Package, title: "SmartShelf", desc: "Track stock in real-time" },
            { icon: TrendingUp, title: "Restock Planning", desc: "AI-powered forecasting" },
            { icon: Zap, title: "MarketMate", desc: "Campaign automation" },
            { icon: BarChart3, title: "Analytics", desc: "Detailed insights" },
          ].map((feature, idx) => (
            <Card key={idx} className="glass-card hover:shadow-glow transition-all">
              <CardHeader>
                <div className="w-12 h-12 glass-card-sm flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg text-foreground">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <Badge className="bg-primary text-primary-foreground border-primary mb-4 font-bold px-4 py-1.5">SERVICES</Badge>
          <h2 className="text-4xl font-bold text-foreground mb-4">Comprehensive Solutions</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="glass-card p-12">
            <h3 className="text-2xl font-bold mb-4 text-foreground">Inventory Management</h3>
            <p className="mb-6 text-muted-foreground">Real-time tracking and AI-powered insights to optimize your stock levels and reduce waste.</p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-nav-active">Learn More</Button>
          </div>
          <div className="space-y-4">
            <div className="flex gap-4 glass-card-sm p-4">
              <div className="w-12 h-12 glass-card-sm flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Real-time Tracking</h4>
                <p className="text-muted-foreground">Monitor inventory across all platforms</p>
              </div>
            </div>
            <div className="flex gap-4 glass-card-sm p-4">
              <div className="w-12 h-12 glass-card-sm flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">AI Predictions</h4>
                <p className="text-muted-foreground">Forecast demand with machine learning</p>
              </div>
            </div>
            <div className="flex gap-4 glass-card-sm p-4">
              <div className="w-12 h-12 glass-card-sm flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Smart Alerts</h4>
                <p className="text-muted-foreground">Get notified before stock runs out</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 order-2 lg:order-1">
            <div className="flex gap-4 glass-card-sm p-4">
              <div className="w-12 h-12 glass-card-sm flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Marketing Automation</h4>
                <p className="text-muted-foreground">Create campaigns with AI assistance</p>
              </div>
            </div>
            <div className="flex gap-4 glass-card-sm p-4">
              <div className="w-12 h-12 glass-card-sm flex items-center justify-center flex-shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Multi-Platform</h4>
                <p className="text-muted-foreground">Manage Shopee, Lazada, TikTok</p>
              </div>
            </div>
            <div className="flex gap-4 glass-card-sm p-4">
              <div className="w-12 h-12 glass-card-sm flex items-center justify-center flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Advanced Analytics</h4>
                <p className="text-muted-foreground">Track performance metrics in detail</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-12 order-1 lg:order-2">
            <h3 className="text-2xl font-bold mb-4 text-foreground">Marketing Campaigns</h3>
            <p className="mb-6 text-muted-foreground">Automate your marketing with AI-powered campaign creation and management.</p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-nav-active">Explore</Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="glass-card p-12 md:p-20 text-center">
          <h2 className="text-4xl font-bold mb-6 text-foreground">Ready to Transform Your Business?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using Business VA to automate and optimize their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 shadow-nav-active" onClick={() => navigate("/login")}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-card-glass-border text-foreground hover:bg-primary/10 glass-card-sm font-semibold">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-card-sm mx-4 mb-4 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.svg" alt="BVA Logo" className="h-16 w-16 object-contain" />
                <span className="font-bold text-foreground">Business VA</span>
              </div>
              <p className="text-muted-foreground">Your AI-powered business assistant</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Features</a></li>
                <li><a href="#" className="hover:text-primary transition">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">About</a></li>
                <li><a href="#" className="hover:text-primary transition">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition">Privacy</a></li>
                <li><a href="#" className="hover:text-primary transition">Terms</a></li>
                <li><a href="#" className="hover:text-primary transition">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-card-glass-border pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Business VA. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
