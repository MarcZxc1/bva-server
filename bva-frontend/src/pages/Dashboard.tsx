import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, AlertCircle, DollarSign, ShoppingCart, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAtRiskInventory, useDashboardAnalytics } from "@/hooks/useSmartShelf";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  // Use the first shop ID if available, otherwise fallback (though fallback likely won't work with real data)
  const shopId = user?.shops?.[0]?.id || "2aad5d00-d302-4c57-86ad-99826e19e610";
  
  const { data: atRiskData } = useAtRiskInventory(shopId, true);
  const { data: analyticsData, isLoading: analyticsLoading } = useDashboardAnalytics(shopId);

  // Fallback data for visualization
  const salesDataFallback = analyticsData?.forecast?.forecasts?.[0]?.predictions.map((val, i) => ({
    month: `Day ${i + 1}`,
    sales: val.predicted_qty,
  })) || [
    { month: "Jan", shopee: 4500, lazada: 3200, tiktok: 2100 },
    { month: "Feb", shopee: 5200, lazada: 3800, tiktok: 2800 },
    { month: "Mar", shopee: 4800, lazada: 4100, tiktok: 3200 },
    { month: "Apr", shopee: 6100, lazada: 4500, tiktok: 3800 },
    { month: "May", shopee: 7200, lazada: 5200, tiktok: 4500 },
    { month: "Jun", shopee: 8100, lazada: 5800, tiktok: 5200 },
  ];

  const topProductsFallback = [
    { name: "Wireless Earbuds Pro", sales: 1234, platform: "Shopee", trend: "up" },
    { name: "Smart Watch Series 5", sales: 987, platform: "Lazada", trend: "up" },
    { name: "USB-C Cable 3-Pack", sales: 856, platform: "TikTok", trend: "down" },
    { name: "Phone Case Premium", sales: 743, platform: "Shopee", trend: "up" },
    { name: "Screen Protector Set", sales: 621, platform: "Lazada", trend: "up" },
  ];

  const stockAlertsFallback = atRiskData?.at_risk?.slice(0, 5).map(item => ({
    product: item.name,
    stock: item.current_quantity,
    status: item.score >= 80 ? "critical" : item.score >= 60 ? "low" : "medium"
  })) || [
    { product: "Wireless Earbuds Pro", stock: 12, status: "critical" },
    { product: "Smart Watch Series 5", stock: 28, status: "low" },
    { product: "Power Bank 20000mAh", stock: 45, status: "medium" },
  ];

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
      {analyticsLoading ? (
        <Card className="glass-card">
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                ₱{(analyticsData?.metrics?.totalRevenue || 2345678).toLocaleString()}
              </div>
              <p className="text-xs text-success flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +18.2% from last month
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
                {analyticsData?.metrics?.totalSales || 4892}
              </div>
              <p className="text-xs text-success flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last month
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
                {analyticsData?.metrics?.totalProducts || 347}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingDown className="h-3 w-3 mr-1" />
                -3 from last week
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
                {atRiskData?.meta?.flagged_count || 23}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Items need attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">📊 Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesDataFallback}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} />
                <Legend />
                <Bar dataKey="shopee" fill="hsl(var(--chart-1))" name="Shopee" />
                <Bar dataKey="lazada" fill="hsl(var(--chart-2))" name="Lazada" />
                <Bar dataKey="tiktok" fill="hsl(var(--chart-3))" name="TikTok" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">📈 Sales Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesDataFallback}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(255, 255, 255, 0.5)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProductsFallback.map((product, index) => (
                <div key={index} className="flex items-center justify-between glass-card-sm p-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.platform}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{product.sales}</span>
                    {product.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockAlertsFallback.map((item, index) => (
                <div key={index} className="flex items-center justify-between glass-card-sm p-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{item.product}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.status === "critical" && "Critical - Restock Now"}
                      {item.status === "low" && "Low Stock"}
                      {item.status === "medium" && "Monitor"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.stock}</span>
                    <AlertCircle className={`h-4 w-4 ${
                      item.status === "critical" ? "text-destructive" :
                      item.status === "low" ? "text-warning" :
                      "text-muted-foreground"
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
