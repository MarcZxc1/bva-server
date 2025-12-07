import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, TrendingUp, Calendar, Loader2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { reportsService, DateRange } from "@/services/reports.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");

  // Fetch dashboard metrics
  const { 
    data: metrics, 
    isLoading: metricsLoading,
    error: metricsError 
  } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: () => reportsService.getMetrics(),
    retry: 2,
  });

  // Fetch sales chart data with date range
  const {
    data: salesChartData,
    isLoading: chartLoading,
    error: chartError,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ["salesChart", dateRange],
    queryFn: () => reportsService.getSalesChart(dateRange),
    enabled: true,
    retry: 2,
  });

  // Fetch platform stats (optional - don't block page if it fails)
  const { 
    data: platformStats, 
    isLoading: platformLoading,
    error: platformError 
  } = useQuery({
    queryKey: ["platformStats", dateRange],
    queryFn: () => {
      // Calculate date range for platform stats
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case "7d":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "30d":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "90d":
          startDate.setDate(endDate.getDate() - 90);
          break;
        case "1y":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(endDate.getDate() - 30);
      }
      return reportsService.getPlatformStats(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );
    },
    retry: 1, // Only retry once for optional data
    retryOnMount: false, // Don't retry on mount if it failed
  });

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    // React Query will automatically refetch when queryKey changes
  };

  const handleExportPDF = () => {
    // Simple print functionality for MVP
    // In production, you could use html2canvas + jsPDF for better PDF generation
    
    // Add print styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-content, .print-content * {
          visibility: visible;
        }
        .print-content {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        .no-print {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Mark content for printing
    const content = document.querySelector('.space-y-6');
    if (content) {
      content.classList.add('print-content');
    }
    
    window.print();
    
    // Cleanup
    setTimeout(() => {
      document.head.removeChild(style);
      content?.classList.remove('print-content');
    }, 1000);
  };

  const isLoading = metricsLoading || chartLoading;
  // Don't block page load on platform stats errors (it's optional data)
  const hasError = metricsError || chartError;
  const hasSalesData = salesChartData && salesChartData.length > 0;
  const totalSalesInPeriod = salesChartData?.reduce((sum, item) => sum + item.total, 0) || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Reports</h2>
          <p className="text-muted-foreground">
            {metricsError?.message || chartError?.message || platformError?.message || "Failed to load report data"}
          </p>
          <Button 
            onClick={() => {
              refetchChart();
              window.location.reload();
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              📊 Analytics & Reports
            </h1>
            <p className="text-muted-foreground">
              Track performance, insights, and comprehensive metrics
            </p>
          </div>
          <div className="flex gap-2 no-print">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 glass-card-sm">
                  <Calendar className="h-4 w-4" />
                  {dateRange === "7d"
                    ? "Last 7 Days"
                    : dateRange === "30d"
                    ? "Last 30 Days"
                    : dateRange === "90d"
                    ? "Last 90 Days"
                    : dateRange === "1y"
                    ? "Last Year"
                    : "Custom"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDateRangeChange("7d")}>
                  Last 7 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange("30d")}>
                  Last 30 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange("90d")}>
                  Last 90 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange("1y")}>
                  Last Year
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={handleExportPDF}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-nav-active"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {metrics?.currency || "PHP"} {metrics?.totalRevenue?.toLocaleString() || "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All-time revenue
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Profit Margin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {metrics?.profitMargin?.toFixed(1) || "0.0"}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average profit margin
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Turnover
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {metrics?.stockTurnover?.toFixed(1) || "0.0"}x
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average turnover rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass-card col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Sales Overview</CardTitle>
              <div className="text-sm text-muted-foreground">
                Period Total: {metrics?.currency || "PHP"} {totalSalesInPeriod.toLocaleString()}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[300px]">
            {!hasSalesData ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">
                  No sales data available for this period
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try selecting a different date range or check back later
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    className="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [
                      `${metrics?.currency || "PHP"} ${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Comparison */}
      {platformStats && platformStats.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {platformStats.map((platform) => (
                <div
                  key={platform.platform}
                  className="p-4 glass-card-sm rounded-lg"
                >
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    {platform.platform}
                  </div>
                  <div className="text-2xl font-bold text-foreground mb-1">
                    {metrics?.currency || "PHP"} {platform.revenue.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {platform.orders} orders • {platform.profitMargin.toFixed(1)}% margin
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Generation */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-foreground">📋 Report Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow"
              onClick={() => {
                // Could navigate to detailed sales report page
                console.log("Sales Summary Report clicked");
              }}
            >
              <div className="font-semibold mb-1 text-foreground">
                Sales Summary Report
              </div>
              <div className="text-xs text-muted-foreground text-left">
                Comprehensive sales analysis across all platforms
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow"
              onClick={() => {
                // Could navigate to profit analysis page
                console.log("Profit Analysis Report clicked");
              }}
            >
              <div className="font-semibold mb-1 text-foreground">
                Profit Analysis Report
              </div>
              <div className="text-xs text-muted-foreground text-left">
                Detailed profit margins and cost analysis
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow"
              onClick={() => {
                // Could navigate to stock turnover report
                console.log("Stock Turnover Report clicked");
              }}
            >
              <div className="font-semibold mb-1 text-foreground">
                Stock Turnover Report
              </div>
              <div className="text-xs text-muted-foreground text-left">
                Inventory movement and turnover metrics
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow"
              onClick={() => {
                // Could show platform comparison modal
                console.log("Platform Comparison clicked");
              }}
            >
              <div className="font-semibold mb-1 text-foreground">
                Platform Comparison
              </div>
              <div className="text-xs text-muted-foreground text-left">
                Performance comparison across Shopee, Lazada, TikTok
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
