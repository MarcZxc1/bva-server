import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import {
  inventoryService,
  PlatformStatus as IPlatformStatus,
} from "@/api/inventory.service";
import { toast } from "sonner";

export function PlatformStatus() {
  const [status, setStatus] = useState<IPlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await inventoryService.getPlatformStatus();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch platform status", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await inventoryService.syncPlatforms();
      toast.success("Inventory synced successfully");
      fetchStatus();
    } catch (error) {
      toast.error("Failed to sync inventory");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return <div>Loading platform status...</div>;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          Platform Connections
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing..." : "Sync Inventory"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4">
          {status &&
            Object.entries(status).map(([platform, isConnected]) => (
              <div
                key={platform}
                className="flex items-center space-x-2 border p-2 rounded-md"
              >
                <span className="capitalize font-medium">{platform}</span>
                {isConnected ? (
                  <CheckCircle className="text-green-500 h-5 w-5" />
                ) : (
                  <PlatformSetupModal
                    platform={platform}
                    onConnect={fetchStatus}
                  />
                )}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformSetupModal({
  platform,
  onConnect,
}: {
  platform: string;
  onConnect: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [open, setOpen] = useState(false);

  const handleConnect = () => {
    // Mock connection logic
    toast.success(`Connected to ${platform}`);
    setOpen(false);
    onConnect();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600 p-0 h-auto"
        >
          <XCircle className="h-5 w-5 mr-1" /> Connect
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect {platform}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key / Credentials</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter ${platform} API Key`}
            />
          </div>
          <Button onClick={handleConnect} className="w-full">
            Connect Platform
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
