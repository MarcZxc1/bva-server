import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAtRiskInventory } from "@/hooks/useSmartShelf";
import { useAuth } from "@/contexts/AuthContext";
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
      return "bg-orange-500/10 text-orange-700 border-orange-200";
    case "Lazada":
      return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "TikTok":
      return "bg-pink-500/10 text-pink-700 border-pink-200";
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-200";
  }
};

export default function Inventory() {
  const { user } = useAuth();
  const shopId = user?.shops?.[0]?.id || "";
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: atRiskData, isLoading, error, refetch } = useAtRiskInventory(shopId, !!shopId);

  const atRiskItems = atRiskData?.data?.at_risk || [];
  const meta = atRiskData?.data?.meta;

  // Filter items based on search query
  const filteredItems = atRiskItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (error) {
      toast.error("Failed to load inventory data");
    }
  }, [error]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Smart Inventory</h1>
          <p className="text-muted-foreground">Manage and track your products across all platforms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading inventory data...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load inventory data. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search products by name or SKU..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
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
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Days to Expiry</TableHead>
                      <TableHead>Recommended Action</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{item.sku}</TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            item.current_quantity < 20 ? "text-destructive" :
                            item.current_quantity < 50 ? "text-warning" :
                            "text-success"
                          }`}>
                            {item.current_quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(item.reasons)}>
                            {getStatusLabel(item.reasons)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            item.score >= 80 ? "text-destructive" :
                            item.score >= 60 ? "text-warning" :
                            "text-muted-foreground"
                          }`}>
                            {item.score}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
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
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm">Edit</Button>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{meta?.total_products || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Across all platforms</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">At-Risk Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{meta?.flagged_count || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Last Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
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
