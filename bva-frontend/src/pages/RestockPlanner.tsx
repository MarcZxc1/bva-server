import { useState, useEffect, useRef } from "react";
import { RestockStrategyResponse } from "@/services/restock.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Calendar, Package, Sparkles, Loader2, PackageOpen, Download, ShoppingCart, AlertCircle, Cloud, CloudRain, Sun, CloudLightning, RefreshCw } from "lucide-react";
import { ForecastCalendar } from "@/components/ForecastCalendar";
import { TrendForecastModal } from "@/components/TrendForecastModal";
import { type CalendarEvent } from "@/utils/forecastHelpers";
import { Checkbox } from "@/components/ui/checkbox";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useRestock } from "@/hooks/useRestock";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useIntegration } from "@/hooks/useIntegration";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { integrationService } from "@/services/integration.service";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Skeleton } from "@/components/ui/skeleton";

const getPriorityColor = (priorityScore: number) => {
  if (priorityScore >= 80) return "destructive";
  if (priorityScore >= 60) return "outline";
  return "secondary";
};

const getPriorityLabel = (priorityScore: number) => {
  if (priorityScore >= 80) return "critical";
  if (priorityScore >= 60) return "high";
  return "medium";
};

/**
 * Get the next upcoming sale event based on current date
 * Returns the sale date in format "MM.DD" (e.g., "11.11", "12.25")
 */
const getNextUpcomingSale = (): string | null => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();
  const currentYear = now.getFullYear();

  // Define major sales throughout the year
  const sales = [
    { month: 1, day: 1, name: "New Year", value: "01.01" },
    { month: 2, day: 14, name: "Valentine's Day", value: "02.14" },
    { month: 6, day: 18, name: "6.18 Sale", value: "06.18" },
    { month: 9, day: 9, name: "9.9 Sale", value: "09.09" },
    { month: 10, day: 10, name: "10.10 Sale", value: "10.10" },
    { month: 11, day: 11, name: "11.11 Mega Sale", value: "11.11" },
    { month: 12, day: 12, name: "12.12 Sale", value: "12.12" },
    { month: 12, day: 25, name: "Christmas", value: "12.25" },
  ];

  // Find the next sale from today
  for (const sale of sales) {
    const saleDate = new Date(currentYear, sale.month - 1, sale.day);
    
    // If sale is today or in the future this year
    if (saleDate >= now) {
      return sale.value;
    }
  }

  // If no sale found this year, return the first sale of next year
  if (sales.length > 0) {
    const nextYear = currentYear + 1;
    const firstSale = sales[0];
    return firstSale.value;
  }

  return null;
};

export default function RestockPlanner() {
  const { user } = useAuth();
  const [shopId, setShopId] = useState(user?.shops?.[0]?.id || "");
  const hasShop = !!shopId;
  const { hasActiveIntegration, isLoading: isLoadingIntegration, integrations } = useIntegration();
  const queryClient = useQueryClient();
  const [budget, setBudget] = useState("50000");
  const [goal, setGoal] = useState<"profit" | "volume" | "balanced">("balanced");
  const [restockDays, setRestockDays] = useState("14");
  const [weatherCondition, setWeatherCondition] = useState<"sunny" | "rainy" | "storm" | null>(null);
  const [isPayday, setIsPayday] = useState(false);
  const [upcomingHoliday, setUpcomingHoliday] = useState<string | null>(null);
  const [nextSaleDate, setNextSaleDate] = useState<string | null>(getNextUpcomingSale());
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  
  // Update next sale date when month changes
  useEffect(() => {
    const newSaleDate = getNextUpcomingSale();
    setNextSaleDate(newSaleDate);
    // If current holiday was set to old date, update it to new date
    if (upcomingHoliday && upcomingHoliday !== newSaleDate) {
      setUpcomingHoliday(null);
    }
  }, []); // Run once on mount and when month changes
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedForecastDate, setSelectedForecastDate] = useState<Date | null>(null);
  const [selectedForecastEvent, setSelectedForecastEvent] = useState<CalendarEvent | null>(null);
  const [isTrendModalOpen, setIsTrendModalOpen] = useState(false);
  const shoppingListRef = useRef<HTMLDivElement>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  const restockMutation = useRestock();
  const restockData = restockMutation.data;
  const [savedRestockData, setSavedRestockData] = useState<RestockStrategyResponse | null>(null);

  // Sync all integrations mutation
  const syncAllIntegrationsMutation = useMutation({
    mutationFn: async (integrationIds: string[]) => {
      const results = await Promise.allSettled(
        integrationIds.map(id => integrationService.syncIntegration(id))
      );
      return results;
    },
    onSuccess: (results) => {
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      // Calculate total products and sales synced
      let totalProducts = 0;
      let totalSales = 0;
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const data = result.value;
          totalProducts += data?.data?.products ?? data?.products ?? 0;
          totalSales += data?.data?.sales ?? data?.sales ?? 0;
        }
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["restock"] });
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["at-risk-inventory"] });

      if (successful > 0) {
        toast.success(
          `Sync completed! ${successful} platform(s) synced. ${totalProducts} products, ${totalSales} sales synced.`
        );
      }
      if (failed > 0) {
        toast.warning(`${failed} platform(s) failed to sync. Check your connections.`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to sync products");
    },
  });

  // Handle sync all products from all platforms
  const handleSyncAllProducts = async () => {
    if (!integrations || integrations.length === 0) {
      toast.error("No integrations found. Please connect a platform first in Settings → Integrations.");
      return;
    }

    // Get all active integrations (with terms accepted)
    const activeIntegrations = integrations.filter((integration) => {
      const settings = integration.settings as any;
      return settings?.termsAccepted === true && settings?.isActive !== false;
    });

    if (activeIntegrations.length === 0) {
      toast.error("No active integrations found. Please connect and accept terms for at least one platform.");
      return;
    }

    const integrationIds = activeIntegrations.map(i => i.id);
    await syncAllIntegrationsMutation.mutateAsync(integrationIds);
  };

  // Enable real-time tracking for restock data
  useRealtimeDashboard({ 
    shopId: shopId || undefined, 
    enabled: !!shopId 
  });

  // Update shopId when user loads
  useEffect(() => {
    if (user?.shops?.[0]?.id) {
      setShopId(user.shops[0].id);
    }
  }, [user]);

  // Load saved restock plan from localStorage on mount
  useEffect(() => {
    if (shopId) {
      const saved = localStorage.getItem(`restock_plan_${shopId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as RestockStrategyResponse;
          setSavedRestockData(parsed);
        } catch (error) {
          console.error("Failed to load saved restock plan:", error);
        }
      }
    }
  }, [shopId]);

  // Save restock plan to localStorage when it's generated
  useEffect(() => {
    if (restockData && shopId) {
      localStorage.setItem(`restock_plan_${shopId}`, JSON.stringify(restockData));
      setSavedRestockData(restockData);
    }
  }, [restockData, shopId]);

  // Use saved data if mutation data is not available
  const displayRestockData = restockData || savedRestockData;

  const handleGeneratePlan = async () => {
    if (!shopId || !budget) {
      toast.error("Please fill in all required fields");
      return;
    }

    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast.error("Budget must be a positive number");
      return;
    }

    // Allow generation if user has a shop, even without active integration
    // The backend will handle the restock plan generation based on available products
    restockMutation.mutate({
      shopId,
      budget: budgetNum,
      goal,
      restockDays: restockDays ? parseInt(restockDays) : undefined,
      weatherCondition: weatherCondition || null,
      isPayday: isPayday || false,
      upcomingHoliday: upcomingHoliday || null,
    });
  };

  const handleApprove = () => {
    if (!displayRestockData || !displayRestockData.recommendations || displayRestockData.recommendations.length === 0) {
      toast.error("No restock recommendations available");
      return;
    }
    setIsShoppingListOpen(true);
  };

  const handleExportPDF = async () => {
    if (!pdfContentRef.current) {
      toast.error("Unable to generate PDF");
      return;
    }

    try {
      toast.loading("Generating PDF...", { id: "pdf-export" });
      
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
      
      const fileName = `Shopping-List-${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF exported successfully!", { id: "pdf-export" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF", { id: "pdf-export" });
    }
  };

  // Generate shopping list from recommendations
  const shoppingList = displayRestockData?.recommendations?.map((rec) => ({
    productName: rec.product_name,
    quantity: rec.recommended_qty,
    cost: rec.cost || 0,
    priority: rec.priority,
    reason: rec.reason,
  })) || [];

  const totalCost = shoppingList.reduce((sum, item) => sum + item.cost, 0);
  const totalItems = shoppingList.reduce((sum, item) => sum + item.quantity, 0);

  // Prepare sales forecast chart data from historical sales
  const salesForecastData = displayRestockData?.salesForecast?.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.revenue,
    quantity: item.quantity,
  })) || [];

  // Prepare restock recommendations chart data
  const restockChartData = displayRestockData?.recommendations?.slice(0, 8).map((rec, index) => ({
    name: rec.product_name.substring(0, 20) + (rec.product_name.length > 20 ? '...' : ''),
    recommended_qty: rec.recommended_qty,
    expected_revenue: rec.expected_revenue,
    cost: rec.cost,
  })) || [];

  // Check if recommendations exist
  const hasRecommendations = displayRestockData && displayRestockData.recommendations && displayRestockData.recommendations.length > 0;

  // Show empty state if no shop
  if (!hasShop) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">📈 Restock Planner</h1>
            <p className="text-muted-foreground">AI-powered demand forecasting and intelligent inventory planning</p>
          </div>
        </div>
        <Card className="glass-card">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">No Shop Found</h2>
                <p className="text-muted-foreground max-w-md">
                  You need a shop to use the Restock Planner. Sellers automatically get a shop created during registration.
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
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
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

  // Show integration info message (but allow using the planner if shop exists)
  // Users can still generate restock plans if they have products, even without active integration

  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">📈 Restock Planner</h1>
          <p className="text-muted-foreground">AI-powered demand forecasting and intelligent inventory planning to maximize profits</p>
        </div>
      </div>

      {/* Input Form */}
      <Card className="glass-card hover:shadow-glow transition-shadow">
        <CardHeader className="border-b border-card-glass-border">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            ✨ Generate Restock Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="shopId">Shop ID</Label>
              <Input
                id="shopId"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                placeholder="SHOP-001"
                className="glass-card-sm border-card-glass-border focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (₱)</Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="50000"
                min="0"
                className="glass-card-sm border-card-glass-border focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Select value={goal} onValueChange={(value: "profit" | "volume" | "balanced") => setGoal(value)}>
                <SelectTrigger className="glass-card-sm border-card-glass-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit">Maximize Profit</SelectItem>
                  <SelectItem value="volume">Maximize Volume</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="restockDays">Restock Days</Label>
              <Input
                id="restockDays"
                type="number"
                value={restockDays}
                onChange={(e) => setRestockDays(e.target.value)}
                placeholder="14"
                min="1"
                max="90"
                className="glass-card-sm border-card-glass-border focus:ring-primary/20"
              />
            </div>
          </div>
          
          {/* Scenario Context Panel */}
          <div className="mt-6 p-4 glass-card-sm border border-card-glass-border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <Label className="text-sm font-semibold text-foreground">Scenario Context</Label>
              <span className="text-xs text-muted-foreground">(Optional - Adjusts demand forecasts)</span>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="weather" className="text-sm">Weather Condition</Label>
                <Select 
                  value={weatherCondition || "none"} 
                  onValueChange={(value) => setWeatherCondition(value === "none" ? null : value as "sunny" | "rainy" | "storm")}
                >
                  <SelectTrigger className="glass-card-sm border-card-glass-border">
                    <SelectValue placeholder="Select weather" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Standard)</SelectItem>
                    <SelectItem value="sunny">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        Sunny
                      </div>
                    </SelectItem>
                    <SelectItem value="rainy">
                      <div className="flex items-center gap-2">
                        <CloudRain className="h-4 w-4 text-blue-500" />
                        Rainy
                      </div>
                    </SelectItem>
                    <SelectItem value="storm">
                      <div className="flex items-center gap-2">
                        <CloudLightning className="h-4 w-4 text-red-500" />
                        Storm
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Storm: +40% essentials, -30% luxury/fashion
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Special Events</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="payday" 
                      checked={isPayday}
                      onCheckedChange={(checked) => setIsPayday(checked === true)}
                    />
                    <Label 
                      htmlFor="payday" 
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4 text-primary" />
                      Is Payday?
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="holiday" 
                      checked={upcomingHoliday === nextSaleDate}
                      onCheckedChange={(checked) => setUpcomingHoliday(checked === true ? nextSaleDate : null)}
                    />
                    <Label 
                      htmlFor="holiday" 
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                      Upcoming Mega Sale {nextSaleDate ? `(${nextSaleDate})` : ''}
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Context Summary</Label>
                <div className="p-3 glass-card-sm border border-card-glass-border rounded text-xs space-y-1">
                  {!weatherCondition && !isPayday && !upcomingHoliday ? (
                    <p className="text-muted-foreground">No context adjustments</p>
                  ) : (
                    <>
                      {weatherCondition && (
                        <p className="text-foreground">
                          <span className="font-semibold">Weather:</span> {weatherCondition}
                        </p>
                      )}
                      {isPayday && (
                        <p className="text-success">
                          <span className="font-semibold">Payday:</span> Active
                        </p>
                      )}
                      {upcomingHoliday && (
                        <p className="text-primary">
                          <span className="font-semibold">Holiday:</span> {upcomingHoliday}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-3">
            <Button 
              className="flex-1 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-nav-active disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={handleGeneratePlan}
              disabled={restockMutation.isPending || isLoadingIntegration || !shopId}
            >
              {restockMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Restock Plan
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleSyncAllProducts}
              disabled={syncAllIntegrationsMutation.isPending || !integrations || integrations.length === 0}
              className="gap-2"
            >
              {syncAllIntegrationsMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sync Products
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {isCalendarOpen ? "Hide" : "Show"} Forecast Calendar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Smart Forecast Calendar */}
      {isCalendarOpen && (
        <ForecastCalendar
          currentDate={new Date()}
          onDateClick={(date, event) => {
            setSelectedForecastDate(date);
            setSelectedForecastEvent(event);
            setIsTrendModalOpen(true);
          }}
        />
      )}

      {/* Trend Forecast Modal */}
      <TrendForecastModal
        open={isTrendModalOpen}
        onOpenChange={setIsTrendModalOpen}
        selectedDate={selectedForecastDate}
        eventName={selectedForecastEvent?.eventName}
      />

      {restockMutation.isError && (
        <Card className="glass-card border-destructive">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-destructive font-semibold">
                {restockMutation.error?.message || "Failed to generate restock plan"}
              </p>
              {restockMutation.error?.message?.includes("Integration Required") && (
                <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm text-foreground mb-2">
                    To use the Restock Planner, you need to:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                    <li>Go to Settings → Integrations</li>
                    <li>Connect your Shopee-Clone account</li>
                    <li>Accept the terms and conditions</li>
                    <li>Sync your data</li>
                  </ul>
                  <Button
                    onClick={() => window.location.href = '/settings'}
                    className="mt-3 gap-2 bg-primary hover:bg-primary/90"
                  >
                    Go to Settings
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {displayRestockData && (
        <>
          {!hasRecommendations ? (
            <Card className="glass-card">
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center space-y-3">
                  <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
                  <div>
                    <h3 className="font-semibold text-lg text-foreground mb-2">No Restocking Needed</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Based on current sales trends and inventory levels, no items need restocking at this time. 
                      Your inventory is well-stocked for the selected period.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Predicted Demand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{displayRestockData.summary.total_items} units</div>
                    <p className="text-xs text-success flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {(displayRestockData.summary.roi || 0).toFixed(1)}% ROI
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Restock Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">{displayRestockData.recommendations.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Products need restocking</p>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Est. Investment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">₱{(displayRestockData.summary.total_cost || 0).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {displayRestockData.budget ? ((displayRestockData.summary.total_cost / displayRestockData.budget) * 100).toFixed(1) : "0.0"}% of budget
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Expected Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">₱{((displayRestockData.summary.projected_revenue || 0) - (displayRestockData.summary.total_cost || 0)).toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">AI prediction</p>
                  </CardContent>
                </Card>
              </div>

              {/* Sales Forecast Chart - Historical Data */}
              {salesForecastData.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Sales History (Last 30 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={salesForecastData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.5)', 
                            borderRadius: '12px', 
                            backdropFilter: 'blur(10px)',
                            padding: '12px'
                          }} 
                          formatter={(value: number, name: string) => {
                            if (name === 'revenue') return `₱${value.toLocaleString()}`;
                            return value;
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Revenue (₱)"
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="quantity" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={2}
                          name="Quantity Sold"
                          dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Restock Recommendations Chart */}
              {restockChartData.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Package className="h-5 w-5 text-primary" />
                      Top Restock Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={restockChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="name" 
                          className="text-xs"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid rgba(255, 255, 255, 0.5)', 
                            borderRadius: '12px', 
                            backdropFilter: 'blur(10px)',
                            padding: '12px'
                          }}
                          formatter={(value: number, name: string) => {
                            if (name === 'expected_revenue' || name === 'cost') return `₱${value.toLocaleString()}`;
                            return value;
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="recommended_qty" 
                          stroke="hsl(var(--success))" 
                          strokeWidth={2}
                          name="Recommended Qty"
                          dot={{ fill: 'hsl(var(--success))', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="expected_revenue" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Expected Revenue (₱)"
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Restock Recommendations Table */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Package className="h-5 w-5 text-primary" />
                      Restock Recommendations
                    </CardTitle>
                    <Button
                      onClick={handleApprove}
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={!displayRestockData || !displayRestockData.recommendations || displayRestockData.recommendations.length === 0}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Approve All & Create Shopping List
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Current Stock</TableHead>
                        <TableHead>Recommended</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Exp. Profit</TableHead>
                        <TableHead>Reasoning</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayRestockData.recommendations.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.product_name}</TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(item.priority)}>
                              {getPriorityLabel(item.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.current_stock}</TableCell>
                          <TableCell className="text-success font-bold">{item.recommended_qty}</TableCell>
                          <TableCell>₱{(item.cost || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-success">₱{((item.expected_revenue || 0) - (item.cost || 0)).toLocaleString()}</TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground" title={item.reason}>
                            {item.reason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Insights */}
              {displayRestockData.insights && displayRestockData.insights.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Calendar className="h-5 w-5 text-primary" />
                      AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {displayRestockData.insights.map((insight, index) => (
                        <div key={index} className="p-3 glass-card-sm">
                          <div className="text-sm text-foreground">{insight}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {displayRestockData.warnings && displayRestockData.warnings.length > 0 && (
                <Card className="glass-card border-warning">
                  <CardHeader>
                    <CardTitle className="text-warning">Warnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {displayRestockData.warnings.map((warning, index) => (
                        <div key={index} className="p-3 glass-card-sm border-warning/20">
                          <div className="text-sm text-warning">{warning}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}

      {/* Hidden PDF Content - Plain White Document */}
      <div className="fixed -left-[9999px] top-0" ref={pdfContentRef}>
        <div className="bg-white p-8 w-[210mm] min-h-[297mm] text-black">
          {/* Header Section */}
          <div className="border-b-2 border-gray-300 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-black mb-4">Restock Shopping List</h1>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Generated:</span>{" "}
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-semibold">Shop ID:</span>{" "}
                <span>{shopId}</span>
              </div>
              <div>
                <span className="font-semibold">Total Items:</span>{" "}
                <span>{totalItems} units</span>
              </div>
              <div>
                <span className="font-semibold">Total Cost:</span>{" "}
                <span className="font-bold text-black">₱{totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Shopping List Items */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-black mb-4">Items to Purchase</h2>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">#</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Product Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Unit Cost</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Total Cost</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-black">Priority</th>
                </tr>
              </thead>
              <tbody>
                {shoppingList.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 text-black">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2 font-medium text-black">{item.productName}</td>
                    <td className="border border-gray-300 px-4 py-2 text-black">{item.quantity}</td>
                    <td className="border border-gray-300 px-4 py-2 text-black">₱{item.quantity > 0 ? (item.cost / item.quantity).toLocaleString() : "0"}</td>
                    <td className="border border-gray-300 px-4 py-2 font-semibold text-black">₱{item.cost.toLocaleString()}</td>
                    <td className="border border-gray-300 px-4 py-2 text-black capitalize">{getPriorityLabel(item.priority)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Section */}
          <div className="border-t-2 border-gray-300 pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-black">Total Cost:</span>
              <span className="text-2xl font-bold text-black">₱{totalCost.toLocaleString()}</span>
            </div>
            {displayRestockData?.budget && (
              <>
                <div className="flex justify-between items-center text-sm text-gray-700">
                  <span>Budget:</span>
                  <span>₱{displayRestockData.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-700">
                  <span>Remaining Budget:</span>
                  <span className={displayRestockData.budget - totalCost < 0 ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>
                    ₱{(displayRestockData.budget - totalCost).toLocaleString()}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Notes Section */}
          {displayRestockData?.insights && displayRestockData.insights.length > 0 && (
            <div className="border-t-2 border-gray-300 pt-4 mt-6">
              <h3 className="font-semibold text-lg text-black mb-2">Notes</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                {displayRestockData.insights.slice(0, 3).map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Shopping List Modal */}
      <Dialog open={isShoppingListOpen} onOpenChange={setIsShoppingListOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-muted-foreground/30 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/20)_transparent]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Shopping List
            </DialogTitle>
            <DialogDescription>
              Your restock shopping list based on AI recommendations
            </DialogDescription>
          </DialogHeader>
          
          <div ref={shoppingListRef} className="space-y-4 p-4 bg-background">
            {/* Header Section */}
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-foreground mb-2">Restock Shopping List</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Generated:</span>{" "}
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Shop ID:</span>{" "}
                  <span className="font-medium">{shopId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Items:</span>{" "}
                  <span className="font-medium">{totalItems} units</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Cost:</span>{" "}
                  <span className="font-medium text-primary">₱{totalCost.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Shopping List Items */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg text-foreground">Items to Purchase</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shoppingList.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.productName}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₱{item.quantity > 0 ? (item.cost / item.quantity).toLocaleString() : "0"}</TableCell>
                      <TableCell className="font-semibold">₱{item.cost.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(item.priority)}>
                          {getPriorityLabel(item.priority)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary Section */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">Total Cost:</span>
                <span className="text-2xl font-bold text-primary">₱{totalCost.toLocaleString()}</span>
              </div>
              {displayRestockData?.budget && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Budget:</span>
                  <span>₱{displayRestockData.budget.toLocaleString()}</span>
                </div>
              )}
              {displayRestockData?.budget && (
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Remaining Budget:</span>
                  <span className={displayRestockData.budget - totalCost < 0 ? "text-destructive" : "text-success"}>
                    ₱{(displayRestockData.budget - totalCost).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Notes Section */}
            {displayRestockData?.insights && displayRestockData.insights.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg text-foreground mb-2">Notes</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {displayRestockData.insights.slice(0, 3).map((insight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsShoppingListOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleExportPDF}
              className="gap-2 bg-primary hover:bg-primary/90"
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
