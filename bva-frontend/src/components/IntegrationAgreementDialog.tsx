// src/components/IntegrationAgreementDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

interface IntegrationAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: "SHOPEE" | "LAZADA" | "TIKTOK" | "OTHER";
  onAgree: () => Promise<void>;
}

export function IntegrationAgreementDialog({
  open,
  onOpenChange,
  platform,
  onAgree,
}: IntegrationAgreementDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!agreed) {
      setError("Please agree to the terms to continue");
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      await onAgree();
      // Reset form on success
      setAgreed(false);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to connect integration");
    } finally {
      setIsConnecting(false);
    }
  };

  const platformName = platform === "SHOPEE" ? "Shopee-Clone" : platform;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Connect {platformName} Integration</DialogTitle>
          <DialogDescription>
            Connect your {platformName} account to sync products, orders, and analytics with BVA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agreement Terms */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Integration Agreement</h4>
            <div className="space-y-2 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg max-h-48 overflow-y-auto">
              <p>
                By connecting {platformName}, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Allow BVA to access your product catalog, sales data, and order information</li>
                <li>Enable automatic synchronization of data between {platformName} and BVA</li>
                <li>Grant BVA permission to use your data for analytics, forecasting, and AI-powered recommendations</li>
                <li>Understand that data will be processed securely and in accordance with our privacy policy</li>
                <li>Your connection will use your authenticated session - no additional API keys required</li>
              </ul>
              <p className="mt-3 text-xs">
                You can disconnect this integration at any time from the Settings page.
              </p>
            </div>
          </div>

          {/* Connection Info */}
          <div className="space-y-2">
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Simple Connection:</strong> This integration will use your authenticated session. 
                No API keys needed - just click "Connect" to authorize BVA to access your {platformName} data.
              </p>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isConnecting}
              className="mt-1"
            />
            <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer">
              I have read and agree to the integration agreement terms above
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setAgreed(false);
              setError(null);
            }}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!agreed || isConnecting}
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Connect Integration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

