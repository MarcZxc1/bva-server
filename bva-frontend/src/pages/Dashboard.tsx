import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, AlertCircle, DollarSign, ShoppingCart, Loader2, PackageOpen, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAtRiskInventory, useDashboardAnalytics } from "@/hooks/useSmartShelf";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id || "";
  
  const { data: atRiskData, isLoading: atRiskLoading } = useAtRiskInventory(shopId, !!shopId);
  const { data: analyticsData, isLoading: analyticsLoading } = useDashboardAnalytics(shopId);

  const isLoading = analyticsLoading || atRiskLoading;

  // Prepare sales data from API response
  const salesData = analyticsData?.forecast?.forecasts?.[0]?.predictions.map((val, i) => ({
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
  const hasNoSalesData = !salesData || salesData.length === 0;
  const hasNoInventory = !atRiskData?.at_risk || atRiskData.at_risk.length === 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="glass-card p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">👋 Welcome Back! Dashboard</h1>
          <p className="text-muted-foreground">Overview of your multi-platform business performance</p>
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

      {/* Quick Actions */}
      {(hasNoSalesData || hasNoInventory) && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground">🚀 Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                To unlock powerful AI insights and forecasts, you need to sync your data from Shopee-Clone:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>• Connect your Shopee-Clone account via SSO</li>
                <li>• Sync your products and sales history</li>
                <li>• Get real-time AI-powered recommendations</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
