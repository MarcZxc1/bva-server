import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, AlertCircle, DollarSign, ShoppingCart } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useDashboardAnalytics } from "@/hooks/useSmartShelf";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const salesData = [
  { month: "Jan", shopee: 4500, lazada: 3200, tiktok: 2100 },
  { month: "Feb", shopee: 5200, lazada: 3800, tiktok: 2800 },
  { month: "Mar", shopee: 4800, lazada: 4100, tiktok: 3200 },
  { month: "Apr", shopee: 6100, lazada: 4500, tiktok: 3800 },
  { month: "May", shopee: 7200, lazada: 5200, tiktok: 4500 },
  { month: "Jun", shopee: 8100, lazada: 5800, tiktok: 5200 },
];

const topProducts = [
  { name: "Wireless Earbuds Pro", sales: 1234, platform: "Shopee", trend: "up" },
  { name: "Smart Watch Series 5", sales: 987, platform: "Lazada", trend: "up" },
  { name: "USB-C Cable 3-Pack", sales: 856, platform: "TikTok", trend: "down" },
  { name: "Phone Case Premium", sales: 743, platform: "Shopee", trend: "up" },
  { name: "Screen Protector Set", sales: 621, platform: "Lazada", trend: "up" },
];

const stockAlerts = [
  { product: "Wireless Earbuds Pro", stock: 12, status: "critical" },
  { product: "Smart Watch Series 5", stock: 28, status: "low" },
  { product: "Power Bank 20000mAh", stock: 45, status: "medium" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: analyticsData, isLoading } = useDashboardAnalytics(user?.id);

  const metrics = analyticsData?.data?.metrics || {
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    totalItems: 0,
    totalProducts: 0,
    totalSales: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your multi-platform business performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">₱{metrics.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.totalItems.toLocaleString()} items sold
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  In inventory
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <div className="text-2xl font-bold text-success">₱{metrics.totalProfit.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.profitMargin.toFixed(1)}% margin
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Bar dataKey="shopee" fill="hsl(var(--chart-1))" name="Shopee" />
                <Bar dataKey="lazada" fill="hsl(var(--chart-2))" name="Lazada" />
                <Bar dataKey="tiktok" fill="hsl(var(--chart-3))" name="TikTok" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line type="monotone" dataKey="shopee" stroke="hsl(var(--chart-1))" strokeWidth={2} name="Shopee" />
                <Line type="monotone" dataKey="lazada" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Lazada" />
                <Line type="monotone" dataKey="tiktok" stroke="hsl(var(--chart-3))" strokeWidth={2} name="TikTok" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.platform}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{product.sales}</span>
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

        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockAlerts.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.status === "critical" && "Critical - Restock Now"}
                      {item.status === "low" && "Low Stock"}
                      {item.status === "medium" && "Monitor"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.stock}</span>
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
