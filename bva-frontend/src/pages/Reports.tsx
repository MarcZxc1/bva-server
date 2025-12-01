import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Calendar } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">Comprehensive analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱2,345,678</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +18.2% vs last period
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32.4%</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.1% improvement
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2x</div>
            <p className="text-xs text-muted-foreground mt-1">Average turnover rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <div className="font-semibold mb-1">Sales Summary Report</div>
              <div className="text-xs text-muted-foreground text-left">Comprehensive sales analysis across all platforms</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <div className="font-semibold mb-1">Profit Analysis Report</div>
              <div className="text-xs text-muted-foreground text-left">Detailed profit margins and cost analysis</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <div className="font-semibold mb-1">Stock Turnover Report</div>
              <div className="text-xs text-muted-foreground text-left">Inventory movement and turnover metrics</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4">
              <div className="font-semibold mb-1">Platform Comparison</div>
              <div className="text-xs text-muted-foreground text-left">Performance comparison across Shopee, Lazada, TikTok</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
