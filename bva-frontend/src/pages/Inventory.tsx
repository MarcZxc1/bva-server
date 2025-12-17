import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, ExternalLink, Loader2, AlertCircle, PackageOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAtRiskInventory } from "@/hooks/useSmartShelf";
import { useAllUserProducts } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

const getStatusColor = (reasons: string[]) => {
  if (reasons.includes("low_stock")) return "destructive";
  if (reasons.includes("near_expiry")) return "outline";
  if (reasons.includes("slow_moving")) return "secondary";
  return "default";
};

const getStatusLabel = (reasons: string[]) => {
  if (reasons.includes("low_stock")) return "critical";
  if (reasons.includes("near_expiry")) return "expiring";
  if (reasons.includes("slow_moving")) return "slow";
  return "good";
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case "Shopee":
      return "glass-card-sm text-primary border-primary/20";
    case "Lazada":
      return "glass-card-sm text-primary border-primary/20";
    case "TikTok":
      return "glass-card-sm text-primary border-primary/20";
    default:
      return "glass-card-sm text-muted-foreground border-card-glass-border";
  }
};

const MOCK_INVENTORY_DATA = {
  at_risk: [
    {
      product_id: "PROD-001",
      name: "Wireless Earbuds Pro",
      sku: "WEB-PRO-2024",
      current_quantity: 12,
      reasons: ["low_stock"],
      score: 85,
      days_to_expiry: undefined,
      recommended_action: {
        action_type: "URGENT RESTOCK",
        reasoning: "Stock below critical level. Immediate reordering required."
      }
    },
    {
      product_id: "PROD-002",
      name: "USB-C Power Bank 20000mAh",
      sku: "PB-20K-USB-C",
      current_quantity: 45,
      reasons: ["near_expiry"],
      score: 72,
      days_to_expiry: 7,
      recommended_action: {
        action_type: "CLEARANCE SALE",
        reasoning: "Product expiring soon. Run promotional campaign to clear stock."
      }
    },
    {
      product_id: "PROD-003",
      name: "Tempered Glass Screen Protector",
      sku: "TG-SCREEN-PROT",
      current_quantity: 156,
      reasons: ["slow_moving"],
      score: 55,
      days_to_expiry: undefined,
      recommended_action: {
        action_type: "REDUCE ORDERS",
        reasoning: "Slow-moving item. Reduce order quantity in next restock cycle."
      }
    },
    {
      product_id: "PROD-004",
      name: "Phone Case Silicone Premium",
      sku: "CASE-SILICON-P",
      current_quantity: 8,
      reasons: ["low_stock"],
      score: 92,
      days_to_expiry: undefined,
      recommended_action: {
        action_type: "EMERGENCY RESTOCK",
        reasoning: "Critical stock level. This is a high-demand item. Restock immediately."
      }
    },
    {
      product_id: "PROD-005",
      name: "Charging Cable 3-in-1",
      sku: "CABLE-3IN1-BLK",
      current_quantity: 34,
      reasons: ["low_stock"],
      score: 68,
      days_to_expiry: undefined,
      recommended_action: {
        action_type: "RESTOCK",
        reasoning: "Stock running low. Schedule reorder for next week."
      }
    },
    {
      product_id: "PROD-006",
      name: "Phone Stand Adjustable",
      sku: "STAND-ADJ-METAL",
      current_quantity: 89,
      reasons: [],
      score: 25,
      days_to_expiry: undefined,
      recommended_action: {
        action_type: "MONITOR",
        reasoning: "Stock level is healthy. Continue monitoring."
      }
    },
    {
      product_id: "PROD-007",
      name: "Bluetooth Speaker Portable",
      sku: "BT-SPEAKER-BLU",
      current_quantity: 3,
      reasons: ["low_stock"],
      score: 88,
      days_to_expiry: undefined,
      recommended_action: {
        action_type: "URGENT RESTOCK",
        reasoning: "Critically low stock on bestseller item. Reorder top priority."
      }
    },
    {
      product_id: "PROD-008",
      name: "Laptop Cooling Pad RGB",
      sku: "COOL-LAPTOP-RGB",
      current_quantity: 52,
      reasons: ["near_expiry"],
      score: 61,
      days_to_expiry: 14,
      recommended_action: {
        action_type: "PROMOTION",
        reasoning: "Approaching expiry date. Launch limited-time offer."
      }
    }
  ],
  meta: {
    total_products: 48,
    flagged_count: 5,
    analysis_date: new Date().toISOString()
  }
};

export default function Inventory() {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id;
  const hasShop = !!shopId;
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: atRiskData, isLoading, error, refetch } = useAtRiskInventory(shopId || "", hasShop);
  const { data: productsData } = useAllUserProducts();

  // Use API data if available
  const atRiskItems = atRiskData?.at_risk || [];
  const meta = atRiskData?.meta;

  // Filter items based on search query
  const filteredItems = atRiskItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (error && hasShop) {
      toast.error("Failed to load inventory data.");
    }
  }, [error, hasShop]);

  // Show empty state if no shop
  if (!hasShop) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
            <p className="text-muted-foreground">Manage your product inventory and stock levels</p>
          </div>
        </div>
        <Card className="glass-card">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">No Shop Found</h2>
                <p className="text-muted-foreground max-w-md">
                  You need a shop to manage inventory. Sellers automatically get a shop created during registration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">📦 Smart Inventory</h1>
            <p className="text-muted-foreground">Monitor at-risk products and optimize stock levels</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading} className="glass-card-sm">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Refresh"
          )}
        </Button>
        <Input
          placeholder="Search products by name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-sm glass-card-sm border-card-glass-border"
        />
      </div>

      {isLoading && !atRiskItems.length && (
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading inventory data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && atRiskItems.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <PackageOpen className="h-16 w-16 text-success/50" />
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">No At-Risk Inventory</h2>
                <p className="text-muted-foreground max-w-md">
                  Great news! Your inventory is healthy. No products are currently at risk.
                  Add more products or sales data to see inventory insights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {atRiskItems.length > 0 && (
        <>
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="outline" className="gap-2 glass-card-sm">
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No products found matching your search." : "No at-risk inventory items found."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Risk Score</TableHead>
                      <TableHead className="text-center">Days to Expiry</TableHead>
                      <TableHead>Recommended Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{item.sku}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            item.current_quantity < 20 ? "text-destructive" :
                            item.current_quantity < 50 ? "text-warning" :
                            "text-success"
                          }`}>
                            {item.current_quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={getStatusColor(item.reasons)}>
                            {getStatusLabel(item.reasons)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            item.score >= 80 ? "text-destructive" :
                            item.score >= 60 ? "text-warning" :
                            "text-muted-foreground"
                          }`}>
                            {item.score}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {item.days_to_expiry !== undefined 
                            ? `${item.days_to_expiry} days`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="max-w-xs">
                            <p className="font-medium">{item.recommended_action.action_type}</p>
                            <p className="text-xs text-muted-foreground">{item.recommended_action.reasoning}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{productsData?.length || meta?.total_products || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all platforms</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">At-Risk Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{meta?.flagged_count || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Need attention</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {meta?.analysis_date 
                    ? new Date(meta.analysis_date).toLocaleDateString()
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">AI-powered analysis</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
