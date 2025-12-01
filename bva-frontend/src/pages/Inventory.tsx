import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Plus,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAtRiskInventory, useAllProducts } from "@/hooks/useSmartShelf";
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

  // Fetch all products
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts,
  } = useAllProducts(shopId, !!shopId);

  // Fetch at-risk analysis
  const {
    data: atRiskData,
    isLoading: isLoadingRisk,
    refetch: refetchRisk,
  } = useAtRiskInventory(shopId, !!shopId);

  const products = productsData?.data || [];
  const atRiskItems = atRiskData?.data?.at_risk || [];
  const meta = atRiskData?.data?.meta;

  // Create a map of at-risk product IDs for quick lookup
  const atRiskMap = new Map(
    atRiskItems.map((item) => [item.product_id, item])
  );

  const isLoading = isLoadingProducts || isLoadingRisk;

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (productsError) {
      toast.error("Failed to load inventory data");
    }
  }, [productsError]);

  const handleRefresh = () => {
    refetchProducts();
    refetchRisk();
  };
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
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
              <span className="ml-2 text-muted-foreground">
                Loading inventory data...
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {productsError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load inventory data. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && !productsError && (
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
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery
                    ? "No products found matching your search."
                    : "No products found. Add products to get started."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Recommended Action</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const atRiskInfo = atRiskMap.get(product.id);
                      const isAtRisk = !!atRiskInfo;

                      return (
                        <TableRow
                          key={product.id}
                          className={isAtRisk ? "bg-yellow-50/50" : ""}
                        >
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {product.sku}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-semibold ${
                                product.quantity < 10
                                  ? "text-destructive"
                                  : product.quantity < 20
                                  ? "text-warning"
                                  : "text-success"
                              }`}
                            >
                              {product.quantity}
                            </span>
                          </TableCell>
                          <TableCell>₱{product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            {isAtRisk ? (
                              <Badge variant={getStatusColor(atRiskInfo.reasons)}>
                                {getStatusLabel(atRiskInfo.reasons)}
                              </Badge>
                            ) : (
                              <Badge variant="outline">Good</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isAtRisk ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${
                                      atRiskInfo.score > 0.7
                                        ? "bg-red-500"
                                        : atRiskInfo.score > 0.4
                                        ? "bg-yellow-500"
                                        : "bg-orange-500"
                                    }`}
                                    style={{
                                      width: `${atRiskInfo.score * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {(atRiskInfo.score * 100).toFixed(0)}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isAtRisk ? (
                              <span className="text-sm">
                                {atRiskInfo.recommended_action.action_type}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
                            ? `${item.days_to_expiry} days`
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="max-w-xs">
                            <p className="font-medium">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {products.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all platforms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  At-Risk Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {atRiskItems.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Last Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {meta?.analysis_date
                    ? new Date(meta.analysis_date).toLocaleDateString()
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  AI-powered analysis
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
