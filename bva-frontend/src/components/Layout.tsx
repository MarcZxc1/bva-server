import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Search, Moon, Sun, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full" style={{ background: 'var(--background-gradient)' }}>
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 ml-2">
          {/* Minimal Top Navigation Bar */}
          <header className="h-16 glass-card-sm mx-4 mt-4 mb-2 flex items-center px-6 sticky top-4 z-10 gap-4">
            <SidebarTrigger className="text-foreground hover:bg-primary/10 rounded-md" />
            
            {/* Search Bar */}
            <div className="flex-1 max-w-md hidden md:flex">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search inventory, campaigns..."
                  className="pl-10 glass-card-sm border-card-glass-border text-foreground placeholder:text-muted-foreground focus:ring-primary/20"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3 ml-auto">
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-md text-foreground hover:bg-primary/10"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="rounded-md relative text-foreground hover:bg-primary/10">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full" />
              </Button>

              {/* User Avatar */}
              <div className="flex items-center gap-3 pl-3 border-l border-border">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">@{user?.email?.split('@')[0]}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold hover:bg-primary/20 transition-colors">
                  {(user?.name || 'U')[0].toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content Area with Generous Padding */}
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
