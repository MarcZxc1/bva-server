import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Calendar, Package, Sparkles, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { useRestockStrategy } from "@/hooks/useRestock";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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

export default function RestockPlanner() {
  const { user } = useAuth();
  const [shopId, setShopId] = useState(user?.id || "SHOP-001");
  const [budget, setBudget] = useState("50000");
  const [goal, setGoal] = useState<"profit" | "volume" | "balanced">("balanced");
  const [restockDays, setRestockDays] = useState("14");
  
  const restockMutation = useRestockStrategy();
  const restockData = restockMutation.data?.data;

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

    restockMutation.mutate({
      shopId,
      budget: budgetNum,
      goal,
      restockDays: restockDays ? parseInt(restockDays) : undefined,
    });
  };

  // Prepare chart data from API response
  const chartData = restockData?.recommendations?.slice(0, 8).map((rec, index) => ({
    date: `Week ${index + 1}`,
    predicted: rec.expectedRevenue / 100,
    restock: rec.recommendedQty,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Restock Planner</h1>
          <p className="text-muted-foreground">AI-powered demand forecasting and inventory planning</p>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Restock Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="shopId">Shop ID</Label>
              <Input
                id="shopId"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                placeholder="SHOP-001"
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Select value={goal} onValueChange={(value: "profit" | "volume" | "balanced") => setGoal(value)}>
                <SelectTrigger>
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
              />
            </div>
          </div>
          <Button 
            className="mt-4 gap-2" 
            onClick={handleGeneratePlan}
            disabled={restockMutation.isPending}
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
        </CardContent>
      </Card>

      {restockMutation.isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              {restockMutation.error?.message || "Failed to generate restock plan"}
            </p>
          </CardContent>
        </Card>
      )}

      {restockData && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="stat-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Predicted Demand</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restockData.summary.totalQuantity} units</div>
                <p className="text-xs text-success flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {restockData.summary.expectedROI.toFixed(1)}% ROI
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Restock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restockData.summary.totalProducts}</div>
                <p className="text-xs text-muted-foreground mt-1">Products need restocking</p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Est. Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱{restockData.summary.totalCost.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {restockData.summary.budgetUtilization.toFixed(1)}% of budget
                </p>
              </CardContent>
            </Card>

            <Card className="stat-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Expected Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">₱{restockData.summary.expectedProfit.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-1">AI prediction</p>
              </CardContent>
            </Card>
          </div>

          {/* Forecast Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Sales Forecast & Restock Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      name="Predicted Demand"
                      dot={{ fill: 'hsl(var(--chart-2))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="restock" 
                      stroke="hsl(var(--success))" 
                      strokeWidth={2} 
                      name="Recommended Stock"
                      dot={{ fill: 'hsl(var(--success))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Restock Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Restock Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {restockData.recommendations.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-smooth">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{item.productName}</h3>
                        <Badge variant={getPriorityColor(item.priorityScore)}>
                          {getPriorityLabel(item.priorityScore)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{item.reasoning}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Current: <strong className="text-foreground">{item.currentStock} units</strong></span>
                        <span>•</span>
                        <span>Restock: <strong className="text-success">{item.recommendedQty} units</strong></span>
                        <span>•</span>
                        <span>Cost: <strong className="text-foreground">₱{item.totalCost.toLocaleString()}</strong></span>
                        <span>•</span>
                        <span>Profit: <strong className="text-success">₱{item.expectedProfit.toLocaleString()}</strong></span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">View Details</Button>
                      <Button>Approve</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          {restockData.insights && restockData.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {restockData.insights.map((insight, index) => (
                    <div key={index} className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="text-sm text-foreground">{insight}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {restockData.warnings && restockData.warnings.length > 0 && (
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="text-warning">Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {restockData.warnings.map((warning, index) => (
                    <div key={index} className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="text-sm text-warning">{warning}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
