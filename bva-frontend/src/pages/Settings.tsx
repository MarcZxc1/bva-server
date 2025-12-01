import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, RefreshCw } from "lucide-react";

const platformConnections = [
  { name: "Shopee", status: "connected", lastSync: "2 minutes ago" },
  { name: "Lazada", status: "connected", lastSync: "5 minutes ago" },
  { name: "TikTok Shop", status: "connected", lastSync: "1 minute ago" },
];

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Integrations</CardTitle>
          <CardDescription>Connect and manage your e-commerce platforms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platformConnections.map((platform) => (
            <div key={platform.name} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Link2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{platform.name}</h3>
                    <Badge variant="default" className="bg-success text-success-foreground">
                      {platform.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Last synced: {platform.lastSync}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="h-3 w-3" />
                  Sync Now
                </Button>
                <Button variant="ghost" size="sm">Configure</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Settings</CardTitle>
          <CardDescription>Configure AI predictions and automation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Demand Forecasting</div>
                <div className="text-sm text-muted-foreground">AI-powered sales predictions</div>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Auto Marketing</div>
                <div className="text-sm text-muted-foreground">Automatic campaign generation</div>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
