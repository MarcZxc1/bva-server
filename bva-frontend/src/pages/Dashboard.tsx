import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PlatformStatus } from "@/components/PlatformStatus";
import { useAtRiskInventory } from "@/hooks/useSmartShelf";
import { useAuth } from "@/contexts/AuthContext";

const salesData = [
  { month: "Jan", shopee: 4500, lazada: 3200, tiktok: 2100 },
  { month: "Feb", shopee: 5200, lazada: 3800, tiktok: 2800 },
  { month: "Mar", shopee: 4800, lazada: 4100, tiktok: 3200 },
  { month: "Apr", shopee: 6100, lazada: 4500, tiktok: 3800 },
  { month: "May", shopee: 7200, lazada: 5200, tiktok: 4500 },
  { month: "Jun", shopee: 8100, lazada: 5800, tiktok: 5200 },
];

const topProducts = [
  {
    name: "Wireless Earbuds Pro",
    sales: 1234,
    platform: "Shopee",
    trend: "up",
  },
  { name: "Smart Watch Series 5", sales: 987, platform: "Lazada", trend: "up" },
  { name: "USB-C Cable 3-Pack", sales: 856, platform: "TikTok", trend: "down" },
  { name: "Phone Case Premium", sales: 743, platform: "Shopee", trend: "up" },
  { name: "Screen Protector Set", sales: 621, platform: "Lazada", trend: "up" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id || "";
  const { data: atRiskData, isLoading: isLoadingRisk } = useAtRiskInventory(
    shopId,
    !!shopId
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your multi-platform business performance
        </p>
      </div>

      <PlatformStatus />

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱2,345,678</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +18.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5.4% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Across 3 platforms
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Alerts
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {atRiskData?.data?.at_risk?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              Items need attention
            </p>
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="shopee"
                  fill="hsl(var(--chart-1))"
                  name="Shopee"
                />
                <Bar
                  dataKey="lazada"
                  fill="hsl(var(--chart-2))"
                  name="Lazada"
                />
                <Bar
                  dataKey="tiktok"
                  fill="hsl(var(--chart-3))"
                  name="TikTok"
                />
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="shopee"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  name="Shopee"
                />
                <Line
                  type="monotone"
                  dataKey="lazada"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Lazada"
                />
                <Line
                  type="monotone"
                  dataKey="tiktok"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  name="TikTok"
                />
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
                    <p className="text-xs text-muted-foreground">
                      {product.platform}
                    </p>
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
            <CardTitle>At-Risk Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoadingRisk ? (
                <p>Loading alerts...</p>
              ) : atRiskData?.data?.at_risk?.length ? (
                atRiskData.data.at_risk.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50 border-red-100"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {item.current_quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Critical
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">
                  No stock alerts at the moment.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
