import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, RefreshCw } from "lucide-react";

const platformConnections = [
  { name: "Shopee", status: "connected", lastSync: "2 minutes ago", logo: "/shopee-logo.png" },
  { name: "Lazada", status: "connected", lastSync: "5 minutes ago", logo: "/lazada-logo.png" },
  { name: "TikTok Shop", status: "connected", lastSync: "1 minute ago", logo: "/tiktok-logo.png" },
];

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">⚙️ Settings</h1>
          <p className="text-muted-foreground">Manage your account and integrations</p>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-foreground">🔗 Platform Integrations</CardTitle>
          <CardDescription className="text-muted-foreground">Connect and manage your e-commerce platforms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platformConnections.map((platform) => (
            <div key={platform.name} className="flex items-center justify-between p-4 glass-card-sm hover:shadow-glow transition-smooth">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 glass-card-sm flex items-center justify-center p-1.5 overflow-hidden">
                  <img 
                    src={platform.logo} 
                    alt={platform.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{platform.name}</h3>
                    <Badge variant="default" className="bg-success text-success-foreground">
                      {platform.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Last synced: {platform.lastSync}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-2 glass-card-sm">
                  <RefreshCw className="h-3 w-3" />
                  Sync Now
                </Button>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">Configure</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-foreground">🤖 AI Settings</CardTitle>
          <CardDescription className="text-muted-foreground">Configure AI predictions and automation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 glass-card-sm hover:shadow-glow transition-smooth">
              <div>
                <div className="font-medium text-foreground">Demand Forecasting</div>
                <div className="text-sm text-muted-foreground">AI-powered sales predictions</div>
              </div>
              <Button variant="outline" className="glass-card-sm">Configure</Button>
            </div>
            <div className="flex items-center justify-between p-3 glass-card-sm hover:shadow-glow transition-smooth">
              <div>
                <div className="font-medium text-foreground">Auto Marketing</div>
                <div className="text-sm text-muted-foreground">Automatic campaign generation</div>
              </div>
              <Button variant="outline" className="glass-card-sm">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
