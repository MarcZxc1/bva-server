import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Calendar } from "lucide-react";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">📊 Analytics & Reports</h1>
            <p className="text-muted-foreground">Track performance, insights, and comprehensive metrics</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 glass-card-sm">
              <Calendar className="h-4 w-4" />
              Date Range
            </Button>
            <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-nav-active">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">₱2,345,678</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +18.2% vs last period
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">32.4%</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.1% improvement
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">4.2x</div>
            <p className="text-xs text-muted-foreground mt-1">Average turnover rate</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-foreground">📋 Report Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
              <div className="font-semibold mb-1 text-foreground">Sales Summary Report</div>
              <div className="text-xs text-muted-foreground text-left">Comprehensive sales analysis across all platforms</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
              <div className="font-semibold mb-1 text-foreground">Profit Analysis Report</div>
              <div className="text-xs text-muted-foreground text-left">Detailed profit margins and cost analysis</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
              <div className="font-semibold mb-1 text-foreground">Stock Turnover Report</div>
              <div className="text-xs text-muted-foreground text-left">Inventory movement and turnover metrics</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
              <div className="font-semibold mb-1 text-foreground">Platform Comparison</div>
              <div className="text-xs text-muted-foreground text-left">Performance comparison across Shopee, Lazada, TikTok</div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
