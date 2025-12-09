import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertTriangle, Package, TrendingDown, Calendar, Loader2, PackageOpen, Pencil, Sparkles, TrendingUp, Clock, Target } from "lucide-react";
import { useAtRiskInventory } from "@/hooks/useSmartShelf";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProducts } from "@/hooks/useProducts";
import { useIntegration } from "@/hooks/useIntegration";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { analyticsService, PromotionResponse } from "@/services/analytics.service";
import { toast } from "sonner";

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
    case "clearance":
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <TrendingDown className="h-4 w-4" />;
  }
};

const getInventoryStatus = (product: any, quantity: number, expiryDate?: string | null) => {
  const isLowStock = quantity <= 10;
  const isExpiringSoon = expiryDate ? (() => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  })() : false;

  // Expiring Soon takes priority
  if (isExpiringSoon) {
    return { label: "Expiring Soon", variant: "outline" as const };
  }
  if (isLowStock) {
    return { label: "Low Stock", variant: "destructive" as const };
  }
  return { label: "Healthy", variant: "secondary" as const };
};

const getPlatformName = (platform?: string | null) => {
  if (!platform) return "—";
  switch (platform.toUpperCase()) {
    case "SHOPEE":
      return "Shopee";
    case "LAZADA":
      return "Lazada";
    case "TIKTOK":
      return "TikTok";
    default:
      return platform;
  }
};

const formatDate = (date?: string | null) => {
  if (!date) return "—";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SmartShelf() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const shopId = user?.shops?.[0]?.id;
  const hasShop = !!shopId;
  
  const { hasActiveIntegration, isLoading: isLoadingIntegration } = useIntegration();
  const { data: atRiskData, isLoading, refetch } = useAtRiskInventory(shopId || "", hasShop);
  const { data: products, isLoading: isLoadingProducts, error: productsError } = useProducts(shopId || "");
  
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [promotionsData, setPromotionsData] = useState<PromotionResponse | null>(null);
  const [isGeneratingPromotions, setIsGeneratingPromotions] = useState(false);
  const [showPromotionsModal, setShowPromotionsModal] = useState(false);
  const [actionItem, setActionItem] = useState<any>(null);

  const handleTakeAction = async (item: any) => {
    const actionType = item.recommended_action.action_type.toLowerCase();
    
    if (actionType.includes("restock")) {
      navigate("/restock");
      return;
    }

    // For promotion, discount, clearance actions - generate promotions
    if (actionType.includes("promotion") || actionType.includes("discount") || actionType.includes("clearance") || actionType.includes("bundle")) {
      if (!shopId) {
        toast.error("Shop ID is required");
        return;
      }

      setIsGeneratingPromotions(true);
      setActionItem(item);

      try {
        // Prepare item data for promotion generation
        const itemData = {
          product_id: item.product_id,
          name: item.name,
          expiry_date: item.days_to_expiry ? (() => {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + item.days_to_expiry);
            return expiry.toISOString();
          })() : null,
          quantity: item.current_quantity,
          price: 0, // Will be fetched from product if needed
          categories: [],
          days_to_expiry: item.days_to_expiry,
        };

        // Fetch product price if available
        const product = products?.find(p => p.id === item.product_id);
        if (product) {
          itemData.price = product.price || 0;
          itemData.categories = product.description ? [product.description] : [];
        }

        const promotions = await analyticsService.generatePromotionsForItem(shopId, itemData);
        setPromotionsData(promotions);
        setShowPromotionsModal(true);
        toast.success(`Generated ${promotions.promotions.length} promotion${promotions.promotions.length !== 1 ? 's' : ''}`);
      } catch (error: any) {
        console.error("Error generating promotions:", error);
        toast.error(error.message || "Failed to generate promotions");
      } finally {
        setIsGeneratingPromotions(false);
      }
    }
  };

  const handleUsePromotion = (promotion: any) => {
    // Navigate to MarketMate with promotion data
    navigate("/marketmate", { 
      state: { 
        promotion,
        product: actionItem 
      } 
    });
    setShowPromotionsModal(false);
    toast.success("Redirecting to MarketMate to create campaign");
  };

  // Show empty state if no shop
  if (!hasShop) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">📊 SmartShelf Analytics</h1>
            <p className="text-muted-foreground">AI-powered inventory risk detection and optimization</p>
          </div>
        </div>
        <Card className="glass-card">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">No Shop Found</h2>
                <p className="text-muted-foreground max-w-md">
                  You need a shop to use SmartShelf Analytics. Sellers automatically get a shop created during registration.
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

  // Show integration required message if no active integration
  if (!hasActiveIntegration) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">📊 SmartShelf Analytics</h1>
            <p className="text-muted-foreground">AI-powered inventory risk detection and optimization</p>
          </div>
        </div>
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Integration Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To see your inventory data and analytics, you need to integrate with Shopee-Clone and accept the terms and conditions.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4">
                <li>• Go to Settings → Integrations</li>
                <li>• Connect your Shopee-Clone account</li>
                <li>• Accept the terms and conditions</li>
                <li>• Sync your data to see inventory analytics</li>
              </ul>
              <div className="pt-2">
                <Button
                  onClick={() => window.location.href = '/settings'}
                  className="gap-2 bg-primary hover:bg-primary/90"
                >
                  Go to Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                      {(item.reasons || []).map((reason, idx) => (
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
                      disabled={isGeneratingPromotions}
                    >
                      {isGeneratingPromotions && actionItem?.product_id === item.product_id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "Take Action"
                      )}
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

      {/* Product Inventory Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-foreground">Product Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProducts ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : productsError ? (
            <div className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive">Error loading products</p>
              <p className="text-sm text-muted-foreground mt-2">
                {productsError instanceof Error ? productsError.message : "Unknown error"}
              </p>
            </div>
          ) : products && products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const quantity = product.quantity || product.stock || 0;
                  const status = getInventoryStatus(product, quantity, product.expiryDate);
                  const isLowStock = quantity <= 10;

                  return (
                    <TableRow
                      key={product.id}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                      <TableCell>{getPlatformName(product.platform)}</TableCell>
                      <TableCell>
                        <span className={isLowStock ? "text-destructive font-semibold" : "font-semibold"}>
                          {quantity}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(product.expiryDate)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={status.variant}
                          className={
                            status.label === "Healthy" 
                              ? "bg-green-500 text-white border-transparent hover:bg-green-600" 
                              : status.label === "Expiring Soon"
                              ? "bg-orange-500 text-white border-transparent hover:bg-orange-600"
                              : ""
                          }
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <Package className="h-12 w-12 text-muted mx-auto mb-4" />
              <p className="text-muted-foreground">No products found</p>
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
                  {(selectedItem.reasons || []).map((reason: string, idx: number) => (
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
    </div>
  );
}
