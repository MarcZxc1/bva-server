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
  onAgree: (apiKey: string) => Promise<void>;
  onGenerateApiKey?: () => Promise<string>;
}

export function IntegrationAgreementDialog({
  open,
  onOpenChange,
  platform,
  onAgree,
  onGenerateApiKey,
}: IntegrationAgreementDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateApiKey = async () => {
    if (!onGenerateApiKey) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const key = await onGenerateApiKey();
      setApiKey(key);
    } catch (err: any) {
      setError(err.message || "Failed to generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey || !agreed) {
      setError("Please provide an API key and agree to the terms");
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      await onAgree(apiKey);
      // Reset form on success
      setApiKey("");
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
                <li>Maintain the security of your API key and not share it with unauthorized parties</li>
              </ul>
              <p className="mt-3 text-xs">
                You can disconnect this integration at any time from the Settings page.
              </p>
            </div>
          </div>

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <div className="flex gap-2">
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isConnecting}
              />
              {onGenerateApiKey && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateApiKey}
                  disabled={isGenerating || isConnecting}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {onGenerateApiKey
                ? "Generate a new API key or enter an existing one from your Shopee-Clone account settings."
                : "Enter your API key from your Shopee-Clone account settings."}
            </p>
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
              setApiKey("");
              setAgreed(false);
              setError(null);
            }}
            disabled={isConnecting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={!apiKey || !agreed || isConnecting}
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

