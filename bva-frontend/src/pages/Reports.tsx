import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Download, TrendingUp, Calendar, Loader2, AlertCircle, FileText, DollarSign, Package, BarChart3, PackageOpen } from "lucide-react";
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
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIntegration } from "@/hooks/useIntegration";
import { Skeleton } from "@/components/ui/skeleton";

export default function Reports() {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id;
  const hasShop = !!shopId;
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [activeReport, setActiveReport] = useState<"sales" | "profit" | "stock" | "platform" | null>(null);
  const reportContentRef = useRef<HTMLDivElement>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  // Check for platform connection (integration or linked shops)
  const { isPlatformConnected, isLoading: isLoadingIntegration } = useIntegration();

  // Fetch dashboard metrics - enabled if shop exists and platform is connected
  const { 
    data: metrics, 
    isLoading: metricsLoading,
    error: metricsError 
  } = useQuery({
    queryKey: ["dashboardMetrics"],
    queryFn: () => reportsService.getMetrics(),
    enabled: hasShop,
    retry: 2,
  });

  // Fetch sales chart data with date range - only if integration is active
  const {
    data: salesChartData,
    isLoading: chartLoading,
    error: chartError,
    refetch: refetchChart,
  } = useQuery({
    queryKey: ["salesChart", dateRange],
    queryFn: () => reportsService.getSalesChart(dateRange),
    enabled: hasShop,
    retry: 2,
  });

  // Fetch platform stats (optional - don't block page if it fails) - only if integration is active
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
    enabled: hasShop,
    retry: 1, // Only retry once for optional data
    retryOnMount: false, // Don't retry on mount if it failed
  });

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    // React Query will automatically refetch when queryKey changes
  };

  // Calculate date range for reports
  const getDateRange = () => {
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
    return {
      start: startDate.toISOString().split("T")[0]!,
      end: endDate.toISOString().split("T")[0]!,
    };
  };

  // Fetch reports data - only if integration is active
  const { data: salesReportData, isLoading: salesReportLoading } = useQuery({
    queryKey: ["salesReport", dateRange],
    queryFn: () => {
      const { start, end } = getDateRange();
      return reportsService.getSalesChart(dateRange, start, end);
    },
    enabled: hasShop && activeReport === "sales",
  });

  const { data: profitReportData, isLoading: profitReportLoading } = useQuery({
    queryKey: ["profitReport", dateRange],
    queryFn: () => {
      const { start, end } = getDateRange();
      return reportsService.getProfitAnalysis(start, end);
    },
    enabled: hasShop && activeReport === "profit",
  });

  const { data: stockReportData, isLoading: stockReportLoading } = useQuery({
    queryKey: ["stockReport", dateRange],
    queryFn: () => {
      const { start, end } = getDateRange();
      return reportsService.getStockTurnoverReport(start, end);
    },
    enabled: hasShop && activeReport === "stock",
  });

  const { data: platformReportData, isLoading: platformReportLoading } = useQuery({
    queryKey: ["platformReport", dateRange],
    queryFn: () => {
      const { start, end } = getDateRange();
      return reportsService.getPlatformStats(start, end);
    },
    enabled: hasShop && activeReport === "platform",
  });

  const handleGenerateReport = (reportType: "sales" | "profit" | "stock" | "platform") => {
    if (!hasShop) {
      toast.error("Please create a shop first");
      return;
    }
    // Allow report generation even without active integration (user might have historical data)
    setActiveReport(reportType);
  };

  const handleExportReportPDF = async () => {
    if (!pdfContentRef.current) {
      toast.error("Unable to generate PDF");
      return;
    }

    try {
      toast.loading("Generating PDF...", { id: "report-pdf-export" });
      
      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const reportNames = {
        sales: "Sales-Summary",
        profit: "Profit-Analysis",
        stock: "Stock-Turnover",
        platform: "Platform-Comparison",
      };
      
      const fileName = `${reportNames[activeReport!]}-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF exported successfully!", { id: "report-pdf-export" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", { id: "report-pdf-export" });
    }
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

  const isLoading = (metricsLoading || chartLoading || isLoadingIntegration) && hasShop;
  // Don't block page load on platform stats errors (it's optional data)
  const hasError = metricsError || chartError;
  const hasSalesData = salesChartData && salesChartData.length > 0;
  const totalSalesInPeriod = salesChartData?.reduce((sum, item) => sum + item.total, 0) || 0;

  // Check for empty states
  const hasNoShop = !hasShop;
  const hasNoIntegration = !isPlatformConnected;

  // Show empty state if user has no shop
  if (hasNoShop) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">📊 Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive business reports and insights</p>
          </div>
        </div>

        <Card className="glass-card border-primary/20">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">No Shop Found</h2>
                <p className="text-muted-foreground max-w-md">
                  You don't have a shop yet. Sellers automatically get a shop created during registration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show skeleton loading while checking integration
  if (isLoadingIntegration) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">📊 Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive business reports and insights</p>
          </div>
        </div>

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
      </div>
    );
  }

  // Note: Removed integration check - users can view reports even without active integration
  // as long as they have a shop and historical sales data

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
      <Card className="glass-card no-print">
        <CardHeader>
          <CardTitle className="text-foreground">📋 Report Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow"
              onClick={() => handleGenerateReport("sales")}
              disabled={!hasShop}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Sales Summary Report</span>
              </div>
              <div className="text-xs text-muted-foreground text-left">
                Comprehensive sales analysis across all platforms
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow"
              onClick={() => handleGenerateReport("profit")}
              disabled={!hasShop}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Profit Analysis Report</span>
              </div>
              <div className="text-xs text-muted-foreground text-left">
                Detailed profit margins and cost analysis
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow"
              onClick={() => handleGenerateReport("stock")}
              disabled={!hasShop}
            >
              <div className="flex items-center gap-2 mb-1">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Stock Turnover Report</span>
              </div>
              <div className="text-xs text-muted-foreground text-left">
                Inventory movement and turnover metrics
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow"
              onClick={() => handleGenerateReport("platform")}
              disabled={!hasShop}
            >
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground">Platform Comparison</span>
              </div>
              <div className="text-xs text-muted-foreground text-left">
                Performance comparison across Shopee, Lazada, TikTok
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Generation Modals */}
      <Dialog open={activeReport !== null} onOpenChange={(open) => !open && setActiveReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/20)_transparent]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeReport === "sales" && <FileText className="h-5 w-5 text-primary" />}
              {activeReport === "profit" && <DollarSign className="h-5 w-5 text-primary" />}
              {activeReport === "stock" && <Package className="h-5 w-5 text-primary" />}
              {activeReport === "platform" && <BarChart3 className="h-5 w-5 text-primary" />}
              {activeReport === "sales" && "Sales Summary Report"}
              {activeReport === "profit" && "Profit Analysis Report"}
              {activeReport === "stock" && "Stock Turnover Report"}
              {activeReport === "platform" && "Platform Comparison Report"}
            </DialogTitle>
            <DialogDescription>
              {activeReport === "sales" && "Comprehensive sales analysis across all platforms"}
              {activeReport === "profit" && "Detailed profit margins and cost analysis"}
              {activeReport === "stock" && "Inventory movement and turnover metrics"}
              {activeReport === "platform" && "Performance comparison across Shopee, Lazada, TikTok"}
            </DialogDescription>
          </DialogHeader>
          
          {/* Visible modal content with glass-card styling */}
          <div ref={reportContentRef} className="space-y-4 p-4 glass-card-sm rounded-lg">
            {/* Sales Summary Report */}
            {activeReport === "sales" && (
              <>
                {salesReportLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : salesReportData && salesReportData.length > 0 ? (
                  <>
                    <div className="border-b-2 border-border pb-4 mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Sales Summary Report</h2>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-semibold">Period:</span>{" "}
                          <span>{getDateRange().start} to {getDateRange().end}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Total Revenue:</span>{" "}
                          <span className="font-bold text-foreground">₱{salesReportData.reduce((sum, item) => sum + item.total, 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Total Orders:</span>{" "}
                          <span>{salesReportData.reduce((sum, item) => sum + item.orders, 0)}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Total Profit:</span>{" "}
                          <span className="font-bold text-foreground">₱{salesReportData.reduce((sum, item) => sum + (item.profit || 0), 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-foreground mb-4">Sales by Period</h3>
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Period</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Revenue</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Orders</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {salesReportData.map((item, index) => (
                            <tr key={index} className="hover:bg-muted/30">
                              <td className="border border-border px-4 py-2 text-foreground">{item.name}</td>
                              <td className="border border-border px-4 py-2 text-foreground">₱{item.total.toLocaleString()}</td>
                              <td className="border border-border px-4 py-2 text-foreground">{item.orders}</td>
                              <td className="border border-border px-4 py-2 text-foreground">₱{(item.profit || 0).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No sales data available for this period</p>
                  </div>
                )}
              </>
            )}

            {/* Profit Analysis Report */}
            {activeReport === "profit" && (
              <>
                {profitReportLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : profitReportData ? (
                  <>
                    <div className="border-b-2 border-border pb-4 mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Profit Analysis Report</h2>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-semibold">Period:</span>{" "}
                          <span>{profitReportData.period.start} to {profitReportData.period.end}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Currency:</span>{" "}
                          <span>PHP</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-foreground mb-4">Financial Summary</h3>
                      <table className="w-full border-collapse border border-border">
                        <tbody>
                          <tr className="hover:bg-muted/30">
                            <td className="border border-border px-4 py-3 font-semibold text-foreground">Total Revenue</td>
                            <td className="border border-border px-4 py-3 text-foreground font-bold">₱{profitReportData.totalRevenue.toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-muted/30">
                            <td className="border border-border px-4 py-3 font-semibold text-foreground">Total Cost (COGS)</td>
                            <td className="border border-border px-4 py-3 text-foreground">₱{profitReportData.totalCost.toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-muted/30">
                            <td className="border border-border px-4 py-3 font-semibold text-foreground">Total Profit</td>
                            <td className="border border-border px-4 py-3 text-foreground font-bold text-green-600">₱{profitReportData.totalProfit.toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-muted/30 bg-muted/50">
                            <td className="border border-border px-4 py-3 font-semibold text-foreground">Profit Margin</td>
                            <td className="border border-border px-4 py-3 text-foreground font-bold">{profitReportData.profitMargin.toFixed(2)}%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No profit data available</p>
                  </div>
                )}
              </>
            )}

            {/* Stock Turnover Report */}
            {activeReport === "stock" && (
              <>
                {stockReportLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : stockReportData ? (
                  <>
                    <div className="border-b-2 border-border pb-4 mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Stock Turnover Report</h2>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-semibold">Period:</span>{" "}
                          <span>{stockReportData.period.start} to {stockReportData.period.end}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Overall Turnover:</span>{" "}
                          <span className="font-bold text-foreground">{stockReportData.stockTurnover.toFixed(2)}x</span>
                        </div>
                        <div>
                          <span className="font-semibold">Inventory Value:</span>{" "}
                          <span className="font-bold text-foreground">₱{stockReportData.inventoryValue.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Cost of Goods Sold:</span>{" "}
                          <span className="font-bold text-foreground">₱{stockReportData.cogs.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-foreground mb-4">Product Turnover Details</h3>
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">SKU</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Product Name</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Current Stock</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Inventory Value</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Turnover Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stockReportData.products && stockReportData.products.length > 0 ? (
                            stockReportData.products.map((product, index) => (
                              <tr key={index} className="hover:bg-muted/30">
                                <td className="border border-border px-4 py-2 text-foreground">{product.sku}</td>
                                <td className="border border-border px-4 py-2 text-foreground">{product.productName}</td>
                                <td className="border border-border px-4 py-2 text-foreground">{product.currentStock}</td>
                                <td className="border border-border px-4 py-2 text-foreground">₱{product.inventoryValue.toLocaleString()}</td>
                                <td className="border border-border px-4 py-2 text-foreground">{product.turnoverRate.toFixed(2)}x</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="border border-border px-4 py-8 text-center text-muted-foreground">
                                No product data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No stock turnover data available</p>
                  </div>
                )}
              </>
            )}

            {/* Platform Comparison Report */}
            {activeReport === "platform" && (
              <>
                {platformReportLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : platformReportData && platformReportData.length > 0 ? (
                  <>
                    <div className="border-b-2 border-border pb-4 mb-6">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Platform Comparison Report</h2>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-semibold">Period:</span>{" "}
                          <span>{getDateRange().start} to {getDateRange().end}</span>
                        </div>
                        <div>
                          <span className="font-semibold">Total Platforms:</span>{" "}
                          <span>{platformReportData.length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-foreground mb-4">Platform Performance</h3>
                      <table className="w-full border-collapse border border-border">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Platform</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Revenue</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Orders</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Profit</th>
                            <th className="border border-border px-4 py-2 text-left font-semibold text-foreground">Profit Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {platformReportData.map((platform, index) => (
                            <tr key={index} className="hover:bg-muted/30">
                              <td className="border border-border px-4 py-2 font-medium text-foreground">{platform.platform}</td>
                              <td className="border border-border px-4 py-2 text-foreground">₱{platform.revenue.toLocaleString()}</td>
                              <td className="border border-border px-4 py-2 text-foreground">{platform.orders}</td>
                              <td className="border border-border px-4 py-2 text-foreground">₱{platform.profit.toLocaleString()}</td>
                              <td className="border border-border px-4 py-2 text-foreground">{platform.profitMargin.toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No platform comparison data available</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Hidden PDF content with white background - same structure as visible content */}
          <div ref={pdfContentRef} className="fixed -left-[9999px] top-0 w-[800px]">
            <div className="space-y-4 p-4 bg-white text-black">
              {/* Sales Summary Report PDF */}
              {activeReport === "sales" && salesReportData && salesReportData.length > 0 && (
                <>
                  <div className="border-b-2 border-gray-300 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-black mb-2">Sales Summary Report</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="font-semibold">Period:</span>{" "}
                        <span>{getDateRange().start} to {getDateRange().end}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Total Revenue:</span>{" "}
                        <span className="font-bold text-black">₱{salesReportData.reduce((sum, item) => sum + item.total, 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Total Orders:</span>{" "}
                        <span>{salesReportData.reduce((sum, item) => sum + item.orders, 0)}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Total Profit:</span>{" "}
                        <span className="font-bold text-black">₱{salesReportData.reduce((sum, item) => sum + (item.profit || 0), 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-black mb-4">Sales by Period</h3>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Period</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Revenue</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Orders</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Profit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesReportData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 text-black">{item.name}</td>
                            <td className="border border-gray-300 px-4 py-2 text-black">₱{item.total.toLocaleString()}</td>
                            <td className="border border-gray-300 px-4 py-2 text-black">{item.orders}</td>
                            <td className="border border-gray-300 px-4 py-2 text-black">₱{(item.profit || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Profit Analysis Report PDF */}
              {activeReport === "profit" && profitReportData && (
                <>
                  <div className="border-b-2 border-gray-300 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-black mb-2">Profit Analysis Report</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="font-semibold">Period:</span>{" "}
                        <span>{profitReportData.period.start} to {profitReportData.period.end}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Currency:</span>{" "}
                        <span>PHP</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-black mb-4">Financial Summary</h3>
                    <table className="w-full border-collapse border border-gray-300">
                      <tbody>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 font-semibold text-black">Total Revenue</td>
                          <td className="border border-gray-300 px-4 py-3 text-black font-bold">₱{profitReportData.totalRevenue.toLocaleString()}</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 font-semibold text-black">Total Cost (COGS)</td>
                          <td className="border border-gray-300 px-4 py-3 text-black">₱{profitReportData.totalCost.toLocaleString()}</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 font-semibold text-black">Total Profit</td>
                          <td className="border border-gray-300 px-4 py-3 text-black font-bold text-green-600">₱{profitReportData.totalProfit.toLocaleString()}</td>
                        </tr>
                        <tr className="hover:bg-gray-50 bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 font-semibold text-black">Profit Margin</td>
                          <td className="border border-gray-300 px-4 py-3 text-black font-bold">{profitReportData.profitMargin.toFixed(2)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Stock Turnover Report PDF */}
              {activeReport === "stock" && stockReportData && (
                <>
                  <div className="border-b-2 border-gray-300 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-black mb-2">Stock Turnover Report</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="font-semibold">Period:</span>{" "}
                        <span>{stockReportData.period.start} to {stockReportData.period.end}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Overall Turnover:</span>{" "}
                        <span className="font-bold text-black">{stockReportData.stockTurnover.toFixed(2)}x</span>
                      </div>
                      <div>
                        <span className="font-semibold">Inventory Value:</span>{" "}
                        <span className="font-bold text-black">₱{stockReportData.inventoryValue.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Cost of Goods Sold:</span>{" "}
                        <span className="font-bold text-black">₱{stockReportData.cogs.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-black mb-4">Product Turnover Details</h3>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">SKU</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Product Name</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Current Stock</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Inventory Value</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Turnover Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockReportData.products && stockReportData.products.length > 0 ? (
                          stockReportData.products.map((product, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-2 text-black">{product.sku}</td>
                              <td className="border border-gray-300 px-4 py-2 text-black">{product.productName}</td>
                              <td className="border border-gray-300 px-4 py-2 text-black">{product.currentStock}</td>
                              <td className="border border-gray-300 px-4 py-2 text-black">₱{product.inventoryValue.toLocaleString()}</td>
                              <td className="border border-gray-300 px-4 py-2 text-black">{product.turnoverRate.toFixed(2)}x</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-700">
                              No product data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Platform Comparison Report PDF */}
              {activeReport === "platform" && platformReportData && platformReportData.length > 0 && (
                <>
                  <div className="border-b-2 border-gray-300 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-black mb-2">Platform Comparison Report</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div>
                        <span className="font-semibold">Period:</span>{" "}
                        <span>{getDateRange().start} to {getDateRange().end}</span>
                      </div>
                      <div>
                        <span className="font-semibold">Total Platforms:</span>{" "}
                        <span>{platformReportData.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-black mb-4">Platform Performance</h3>
                    <table className="w-full border-collapse border border-gray-300">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Platform</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Revenue</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Orders</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Profit</th>
                          <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Profit Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformReportData.map((platform, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-2 font-medium text-black">{platform.platform}</td>
                            <td className="border border-gray-300 px-4 py-2 text-black">₱{platform.revenue.toLocaleString()}</td>
                            <td className="border border-gray-300 px-4 py-2 text-black">{platform.orders}</td>
                            <td className="border border-gray-300 px-4 py-2 text-black">₱{platform.profit.toLocaleString()}</td>
                            <td className="border border-gray-300 px-4 py-2 text-black">{platform.profitMargin.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setActiveReport(null)}
            >
              Close
            </Button>
            <Button
              onClick={handleExportReportPDF}
              className="gap-2 bg-primary hover:bg-primary/90"
              disabled={
                (activeReport === "sales" && (!salesReportData || salesReportData.length === 0)) ||
                (activeReport === "profit" && !profitReportData) ||
                (activeReport === "stock" && !stockReportData) ||
                (activeReport === "platform" && (!platformReportData || platformReportData.length === 0))
              }
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
