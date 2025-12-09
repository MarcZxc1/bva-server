import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Package, AlertCircle, DollarSign, ShoppingCart, Loader2, PackageOpen, BarChart3, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAtRiskInventory, useDashboardAnalytics } from "@/hooks/useSmartShelf";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useIntegration } from "@/hooks/useIntegration";
import { useState, useMemo } from "react";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id;
  const hasShop = !!shopId;
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { hasActiveIntegration, isLoading: isLoadingIntegration } = useIntegration();
  const { data: atRiskData, isLoading: atRiskLoading, refetch: refetchAtRisk } = useAtRiskInventory(shopId || "", hasShop && hasActiveIntegration);
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useDashboardAnalytics(shopId || "", hasShop && hasActiveIntegration);
  
  // Enable real-time updates
  const { isConnected } = useRealtimeDashboard({ 
    shopId: shopId || undefined, 
    enabled: hasShop && hasActiveIntegration
  });

  const isLoading = (analyticsLoading || atRiskLoading || isLoadingIntegration) && hasShop;

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
  // The forecast structure: forecast.forecasts[].predictions[]
  // Aggregate all product forecasts into a single time series
  const salesData = useMemo(() => {
    if (!analyticsData?.forecast?.forecasts || analyticsData.forecast.forecasts.length === 0) {
      return [];
    }

    // Aggregate predictions from all products
    const aggregatedPredictions: { [key: string]: number } = {};
    
    analyticsData.forecast.forecasts.forEach((productForecast: any) => {
      if (productForecast.predictions && Array.isArray(productForecast.predictions)) {
        productForecast.predictions.forEach((prediction: any, index: number) => {
          const dayKey = `Day ${index + 1}`;
          if (!aggregatedPredictions[dayKey]) {
            aggregatedPredictions[dayKey] = 0;
          }
          aggregatedPredictions[dayKey] += Math.round(prediction.predicted_qty || 0);
        });
      }
    });

    // Convert to array format for chart
    return Object.entries(aggregatedPredictions)
      .sort((a, b) => {
        const dayA = parseInt(a[0].replace('Day ', ''));
        const dayB = parseInt(b[0].replace('Day ', ''));
        return dayA - dayB;
      })
      .map(([month, sales]) => ({ month, sales }));
  }, [analyticsData?.forecast]);

  // Prepare stock alerts from at-risk data
  const stockAlerts = atRiskData?.at_risk?.slice(0, 5).map(item => ({
    product: item.name,
    stock: item.current_quantity,
    score: item.score,
    status: item.score >= 80 ? "critical" : item.score >= 60 ? "low" : "medium"
  })) || [];

  // Check for empty states
  const hasNoShop = !hasShop;
  const hasNoIntegration = !hasActiveIntegration;
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

      {/* Skeleton Loading for Integration Check */}
      {isLoadingIntegration && (
        <Card className="glass-card border-primary/20">
          <CardContent className="py-8">
            <div className="space-y-4">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Required Message - Show first if no integration */}
      {!isLoadingIntegration && hasNoIntegration && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Integration Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To see your dashboard metrics and analytics, you need to integrate with Shopee-Clone and accept the terms and conditions.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>• Go to Settings → Integrations</li>
                <li>• Connect your Shopee-Clone account</li>
                <li>• Accept the terms and conditions</li>
                <li>• Sync your data to see dashboard metrics</li>
              </ul>
              <div className="pt-2">
                <Button
                  onClick={() => window.location.href = '/settings'}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics - Only show if integration is active */}
      {!isLoadingIntegration && hasActiveIntegration && (
        <>
          {isLoading ? (
            <div className="space-y-4">
              {/* Skeleton for metrics cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="glass-card">
                    <CardHeader className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-32 mb-2" />
                      <Skeleton className="h-3 w-40" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              {/* Skeleton for charts */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="glass-card">
                  <CardHeader>
                    <Skeleton className="h-5 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardHeader>
                    <Skeleton className="h-5 w-48" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-64 w-full" />
                  </CardContent>
                </Card>
              </div>
            </div>
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

        {/* Quick Actions - Show when no data but integration exists */}
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
                    <li>• Sync your sales data from Shopee-Clone</li>
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
                  {isSyncing ? "Refreshing..." : "Sync Data from Shopee-Clone"}
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        )}
        </>
      )}
    </div>
  );
}
