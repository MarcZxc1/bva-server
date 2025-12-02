import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, TrendingDown, Calendar, Loader2, Sparkles } from "lucide-react";
import { useAtRiskInventory } from "@/hooks/useSmartShelf";
import { useAuth } from "@/contexts/AuthContext";

const getRiskColor = (score: number): "destructive" | "secondary" | "outline" => {
  if (score >= 80) return "destructive";
  if (score >= 60) return "outline"; // Using outline for warning
  return "secondary";
};

const getRiskLabel = (score: number) => {
  if (score >= 80) return "Critical";
  if (score >= 60) return "High Risk";
  return "Medium Risk";
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "restock":
      return <Package className="h-4 w-4" />;
    case "promotion":
      return <Sparkles className="h-4 w-4" />;
    case "clearance":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <TrendingDown className="h-4 w-4" />;
  }
};

export default function SmartShelf() {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id || "f7df4850-86bb-4b3e-8374-37f1c76d6793";
  
  const { data: atRiskData, isLoading, refetch } = useAtRiskInventory(shopId, true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">📊 SmartShelf Analytics</h1>
            <p className="text-muted-foreground">AI-powered inventory risk detection and optimization</p>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline"
            className="gap-2"
          >
            Refresh Analysis
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {atRiskData?.data?.meta?.total_products || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">In inventory</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At-Risk Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">
              {atRiskData?.data?.meta?.flagged_count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {atRiskData?.data?.at_risk?.filter(item => item.score >= 80).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Immediate action required</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Analysis Date</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">
              {atRiskData?.data?.meta?.analysis_date 
                ? new Date(atRiskData.data.meta.analysis_date).toLocaleDateString()
                : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last updated</p>
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Inventory */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-warning" />
            ⚠️ At-Risk Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : atRiskData?.data?.at_risk && atRiskData.data.at_risk.length > 0 ? (
            <div className="space-y-4">
              {atRiskData.data.at_risk.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 glass-card-sm hover:shadow-glow transition-smooth border-l-4"
                  style={{
                    borderLeftColor: item.score >= 80 ? 'hsl(var(--destructive))' : 
                                     item.score >= 60 ? 'hsl(var(--warning))' : 
                                     'hsl(var(--muted))'
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <Badge variant={getRiskColor(item.score)}>
                        {getRiskLabel(item.score)} - {item.score}
                      </Badge>
                      <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Stock: <strong className="text-foreground">{item.current_quantity} units</strong>
                      </span>
                      {item.days_to_expiry !== undefined && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires in: <strong className="text-warning">{item.days_to_expiry} days</strong>
                          </span>
                        </>
                      )}
                      {item.avg_daily_sales !== undefined && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            Avg Sales: <strong className="text-foreground">{item.avg_daily_sales.toFixed(1)}/day</strong>
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.reasons.map((reason, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {reason.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>

                    <div className="p-3 glass-card-sm text-sm">
                      <div className="flex items-start gap-2">
                        {getActionIcon(item.recommended_action.action_type)}
                        <div>
                          <div className="font-semibold text-foreground capitalize mb-1">
                            {item.recommended_action.action_type.replace(/_/g, ' ')}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {item.recommended_action.reasoning}
                          </div>
                          {item.recommended_action.restock_qty && (
                            <div className="text-xs mt-1 text-success">
                              Recommended Restock: <strong>{item.recommended_action.restock_qty} units</strong>
                            </div>
                          )}
                          {item.recommended_action.discount_range && (
                            <div className="text-xs mt-1 text-warning">
                              Suggested Discount: <strong>{item.recommended_action.discount_range[0]}-{item.recommended_action.discount_range[1]}%</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      Take Action
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 text-muted mx-auto mb-4" />
              <p className="text-muted-foreground">No at-risk inventory detected</p>
              <p className="text-sm text-muted-foreground mt-2">All products are in good condition!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
