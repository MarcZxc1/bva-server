import { LayoutDashboard, Package, TrendingUp, Megaphone, FileText, Settings, LogOut, ExternalLink, AlertCircle } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { integrationService } from "@/services/integration.service";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  // { title: "Smart Inventory", url: "/inventory", icon: Package },
  { title: "SmartShelf", url: "/smartshelf", icon: AlertCircle },
  { title: "Restock Planner", url: "/restock", icon: TrendingUp },
  { title: "MarketMate", url: "/ads", icon: Megaphone },
  { title: "Reports", url: "/reports", icon: FileText },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
];

// Platform definitions
const platformDefinitions = [
  { name: "Shopee", platform: "SHOPEE", logo: "/shopee-logo.png" },
  { name: "Lazada", platform: "LAZADA", logo: "/lazada-logo.png" },
  { name: "TikTok", platform: "TIKTOK", logo: "/tiktok-logo.png" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Fetch integrations to check connection status
  const { data: integrations } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrationService.getIntegrations(),
  });

  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "nav-item active font-medium" 
      : "text-sidebar-foreground hover:bg-primary/10 rounded-md transition-smooth";

  return (
    <Sidebar 
      className={`${isCollapsed ? "w-14" : "w-64"} glass-card sidebar-aligned border-0 shadow-none`} 
      collapsible="icon"
      variant="floating"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <img 
              src="/bva-logo.svg" 
              alt="BVA Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="font-semibold text-sidebar-foreground">Business VA</span>
          </div>
        )}
        {isCollapsed && (
          <img 
            src="/bva-logo.svg" 
            alt="BVA Logo" 
            className="h-8 w-8 object-contain mx-auto"
          />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className={isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Platform Connections Section */}
        <SidebarSeparator className="my-2" />
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : "text-xs text-muted-foreground"}>
            Platform Connections
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {isCollapsed ? (
              <div className="flex flex-col gap-1.5">
                {platformDefinitions.map((platformDef) => {
                  const isConnected = integrations?.some(i => i.platform === platformDef.platform);
                  const statusColor = platformDef.platform === "SHOPEE" 
                    ? (isConnected ? "bg-green-500" : "bg-orange-500")
                    : "bg-orange-500"; // Lazada and TikTok always orange
                  return (
                    <div
                      key={platformDef.name}
                      className="flex items-center justify-center p-1.5 rounded-md hover:bg-primary/10 transition-smooth relative"
                      title={`${platformDef.name}: ${isConnected ? "Connected" : "Not Connected"}`}
                    >
                      <img 
                        src={platformDef.logo} 
                        alt={platformDef.name}
                        className="h-5 w-5 object-contain opacity-80"
                      />
                      <div className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar-background ${statusColor}`}></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1">
                {platformDefinitions.map((platformDef) => {
                  const isConnected = integrations?.some(i => i.platform === platformDef.platform);
                  const statusColor = platformDef.platform === "SHOPEE" 
                    ? (isConnected ? "bg-green-500" : "bg-orange-500")
                    : "bg-orange-500"; // Lazada and TikTok always orange
                  return (
                    <div
                      key={platformDef.name}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-primary/10 transition-smooth"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative h-6 w-6 flex items-center justify-center flex-shrink-0">
                          <img 
                            src={platformDef.logo} 
                            alt={platformDef.name}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              // Fallback if image fails to load
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = document.createElement('div');
                              fallback.className = 'h-full w-full flex items-center justify-center text-[10px] font-semibold text-primary';
                              fallback.textContent = platformDef.name.substring(0, 2).toUpperCase();
                              target.parentElement?.appendChild(fallback);
                            }}
                          />
                        </div>
                        <span className="text-xs text-sidebar-foreground truncate">{platformDef.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div 
                          className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusColor}`}
                          title={isConnected ? "Connected" : "Not Connected"}
                        ></div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate("/settings")}
                          className="h-6 w-6 p-0 hover:bg-primary/20 text-sidebar-foreground"
                          title="Manage platform settings"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClass}>
                      <item.icon className={isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border flex-shrink-0 mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setShowLogoutDialog(true)}
              className="text-sidebar-foreground hover:bg-primary/10 rounded-md cursor-pointer transition-smooth"
            >
              <LogOut className={isCollapsed ? "h-5 w-5" : "h-5 w-5 mr-3"} />
              {!isCollapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your dashboard and features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logout();
                window.location.href = '/login';
              }}
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}
