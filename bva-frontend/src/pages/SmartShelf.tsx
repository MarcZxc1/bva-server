import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Package, TrendingDown, Calendar, Loader2, Sparkles } from "lucide-react";
import { useAtRiskInventory } from "@/hooks/useSmartShelf";
import { useAuth } from "@/contexts/AuthContext";
import { AdGeneratorDialog } from "@/components/AdGeneratorDialog";

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
  const navigate = useNavigate();
  const shopId = user?.shops?.[0]?.id || "2aad5d00-d302-4c57-86ad-99826e19e610";
  
  const { data: atRiskData, isLoading, refetch } = useAtRiskInventory(shopId, true);
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [adDialogProps, setAdDialogProps] = useState<{
    productName: string;
    playbook: "Flash Sale" | "New Arrival" | "Best Seller Spotlight" | "Bundle Up!";
  }>({ productName: "", playbook: "Flash Sale" });

  const handleTakeAction = (item: any) => {
    const actionType = item.recommended_action.action_type.toLowerCase();
    
    if (actionType.includes("restock")) {
      navigate("/restock");
    } else if (actionType.includes("promotion") || actionType.includes("clearance")) {
      setAdDialogProps({
        productName: item.name,
        playbook: actionType.includes("clearance") ? "Flash Sale" : "Best Seller Spotlight"
      });
      setIsAdDialogOpen(true);
    }
  };

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
              {atRiskData?.meta?.total_products || 0}
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
              {atRiskData?.meta?.flagged_count || 0}
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
              {atRiskData?.at_risk?.filter(item => item.score >= 80).length || 0}
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
              {atRiskData?.meta?.analysis_date 
                ? new Date(atRiskData.meta.analysis_date).toLocaleDateString()
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
          ) : atRiskData?.at_risk && atRiskData.at_risk.length > 0 ? (
            <div className="space-y-4">
              {atRiskData.at_risk.map((item, index) => (
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
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      onClick={() => handleTakeAction(item)}
                    >
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

      {/* View Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Product Details
            </DialogTitle>
            <DialogDescription>
              Detailed analysis and risk factors for {selectedItem?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {selectedItem.sku}</p>
                </div>
                <Badge variant={getRiskColor(selectedItem.score)} className="text-lg px-3 py-1">
                  Score: {selectedItem.score}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="glass-card-sm p-4">
                  <div className="text-sm text-muted-foreground mb-1">Current Stock</div>
                  <div className="text-2xl font-bold">{selectedItem.current_quantity}</div>
                </Card>
                <Card className="glass-card-sm p-4">
                  <div className="text-sm text-muted-foreground mb-1">Avg Daily Sales</div>
                  <div className="text-2xl font-bold">{selectedItem.avg_daily_sales?.toFixed(1) || "N/A"}</div>
                </Card>
                <Card className="glass-card-sm p-4">
                  <div className="text-sm text-muted-foreground mb-1">Days to Expiry</div>
                  <div className={`text-2xl font-bold ${selectedItem.days_to_expiry < 30 ? "text-warning" : ""}`}>
                    {selectedItem.days_to_expiry || "N/A"}
                  </div>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Risk Factors
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedItem.reasons.map((reason: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {reason.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  {getActionIcon(selectedItem.recommended_action.action_type)}
                  Recommended Action: {selectedItem.recommended_action.action_type.replace(/_/g, ' ')}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedItem.recommended_action.reasoning}
                </p>
                
                {selectedItem.recommended_action.restock_qty && (
                  <div className="text-sm font-medium text-success">
                    Recommended Restock Quantity: {selectedItem.recommended_action.restock_qty} units
                  </div>
                )}
                
                {selectedItem.recommended_action.discount_range && (
                  <div className="text-sm font-medium text-warning">
                    Suggested Discount Range: {selectedItem.recommended_action.discount_range[0]}% - {selectedItem.recommended_action.discount_range[1]}%
                  </div>
                )}

                <Button className="w-full mt-4" onClick={() => {
                  setSelectedItem(null);
                  handleTakeAction(selectedItem);
                }}>
                  Proceed with Action
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ad Generator Dialog */}
      <AdGeneratorDialog 
        open={isAdDialogOpen} 
        onOpenChange={setIsAdDialogOpen}
        initialProductName={adDialogProps.productName}
        initialPlaybook={adDialogProps.playbook}
      />
    </div>
  );
}
