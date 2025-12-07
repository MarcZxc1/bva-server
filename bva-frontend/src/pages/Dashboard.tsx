import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Package, AlertCircle, DollarSign, ShoppingCart, Loader2, PackageOpen, BarChart3, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAtRiskInventory, useDashboardAnalytics } from "@/hooks/useSmartShelf";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function Dashboard() {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id;
  const hasShop = !!shopId;
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { data: atRiskData, isLoading: atRiskLoading, refetch: refetchAtRisk } = useAtRiskInventory(shopId || "", hasShop);
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useDashboardAnalytics(shopId || "", hasShop);
  
  // Enable real-time updates
  const { isConnected } = useRealtimeDashboard({ 
    shopId: shopId || undefined, 
    enabled: hasShop 
  });

  const isLoading = (analyticsLoading || atRiskLoading) && hasShop;

  // Handle data sync from Shopee-Clone
  const handleSyncData = async () => {
    if (!user?.shops?.[0]?.id) return;
    
    setIsSyncing(true);
    try {
      // Refresh local data first
      await Promise.all([
        refetchAtRisk(),
        refetchAnalytics(),
      ]);
      
      // Note: Full sync from Shopee-Clone requires API key and happens via SSO login
      // This button refreshes the current data. For full sync, use SSO login.
      console.log("Data refreshed. For full Shopee-Clone sync, use SSO login.");
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Prepare sales data from API response
  const salesData = analyticsData?.forecast?.forecasts?.[0]?.predictions?.map((val, i) => ({
    month: `Day ${i + 1}`,
    sales: Math.round(val.predicted_qty),
  })) || [];

  // Prepare stock alerts from at-risk data
  const stockAlerts = atRiskData?.at_risk?.slice(0, 5).map(item => ({
    product: item.name,
    stock: item.current_quantity,
    score: item.score,
    status: item.score >= 80 ? "critical" : item.score >= 60 ? "low" : "medium"
  })) || [];

  // Check for empty states
  const hasNoShop = !hasShop;
  const hasNoSalesData = !salesData || salesData.length === 0;
  const hasNoInventory = !atRiskData?.at_risk || atRiskData.at_risk.length === 0;

  // Show empty state if user has no shop
  if (hasNoShop) {
    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="glass-card p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">👋 Welcome, {user?.name || user?.email}!</h1>
            <p className="text-muted-foreground">Get started with your Business Virtual Assistant</p>
          </div>
        </div>

        {/* Empty State - No Shop */}
        <Card className="glass-card border-primary/20">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">No Shop Found</h2>
                <p className="text-muted-foreground max-w-md">
                  You don't have a shop yet. Sellers automatically get a shop created during registration.
                  If you're a buyer, you can browse products but won't have shop management features.
                </p>
              </div>
              <div className="mt-6 p-6 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-semibold text-foreground mb-3">What you can do:</h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left">
                  <li>• If you're a SELLER: Your shop should have been created automatically</li>
                  <li>• Try refreshing the page or logging out and back in</li>
                  <li>• Contact support if you believe this is an error</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="glass-card p-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">👋 Welcome Back, {user?.name || user?.email}!</h1>
            <p className="text-muted-foreground">
              Overview of your multi-platform business performance
              {user?.shops?.[0] && ` - ${user.shops[0].name}`}
            </p>
          </div>
          {/* Real-time Connection Status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-green-500 font-medium">Live</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-gray-400" />
                <span className="text-gray-400">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      {isLoading ? (
        <Card className="glass-card">
          <CardContent className="py-12 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ₱{(analyticsData?.metrics?.totalRevenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime revenue
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analyticsData?.metrics?.totalSales || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed transactions
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Active Products</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {analyticsData?.metrics?.totalProducts || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In your inventory
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Stock Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {atRiskData?.meta?.flagged_count || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Items need attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sales Forecast Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Sales Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : hasNoSalesData ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-3">
              <PackageOpen className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">No Sales History Found</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Start selling products to see AI-powered sales forecasts and trends. 
                  Sync your data from Shopee-Clone to get started.
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.5)', 
                    borderRadius: '12px', 
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--chart-1))" 
                  strokeWidth={3} 
                  name="Predicted Sales"
                  dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Inventory Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Stock Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : hasNoInventory ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
              <Package className="h-12 w-12 text-success/50" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Inventory is Healthy</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  No items are currently at risk. All your products have adequate stock levels.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {stockAlerts.map((item, index) => (
                <div key={index} className="flex items-center justify-between glass-card-sm p-3 hover:shadow-glow transition-smooth">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{item.product}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.status === "critical" && "🔴 Critical - Restock Immediately"}
                      {item.status === "low" && "🟡 Low Stock - Restock Soon"}
                      {item.status === "medium" && "🟢 Monitor - Stock Running Low"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{item.stock}</div>
                      <div className="text-xs text-muted-foreground">units</div>
                    </div>
                    <AlertCircle className={`h-5 w-5 ${
                      item.status === "critical" ? "text-destructive" :
                      item.status === "low" ? "text-warning" :
                      "text-muted-foreground"
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions - Show when no data */}
      {(hasNoSalesData || hasNoInventory) && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground">🚀 Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {hasNoSalesData && hasNoInventory 
                  ? "Your shop is set up! Now you need data to see insights:"
                  : hasNoSalesData
                  ? "Add sales data to see AI-powered forecasts:"
                  : "Your inventory looks good! Add more products to track:"}
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                {hasNoSalesData && (
                  <>
                    <li>• Connect your Shopee-Clone account via SSO to sync sales</li>
                    <li>• Or manually add sales records through the API</li>
                  </>
                )}
                {hasNoInventory && (
                  <>
                    <li>• Add products to your inventory</li>
                    <li>• Sync products from Shopee-Clone</li>
                  </>
                )}
                <li>• Get real-time AI-powered recommendations once you have data</li>
              </ul>
              <div className="pt-2">
                <Button
                  onClick={handleSyncData}
                  disabled={isSyncing}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? "Refreshing..." : "Refresh Data"}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: For full sync from Shopee-Clone, use SSO login which automatically syncs your data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
