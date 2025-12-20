// src/components/ShopeeCloneIntegrationModal.tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2, Store } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ShopInfo {
  id: string;
  name: string;
}

interface ShopeeCloneIntegrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (shopId: string, shopName: string, token: string) => Promise<void>;
}

export function ShopeeCloneIntegrationModal({
  open,
  onOpenChange,
  onConnect,
}: ShopeeCloneIntegrationModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null);
  const [shopeeToken, setShopeeToken] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'not_authenticated'>('checking');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const SHOPEE_CLONE_URL = import.meta.env.VITE_SHOPEE_CLONE_URL || 'http://localhost:5173';

  // Listen for messages from shopee-clone iframe
  useEffect(() => {
    if (!open) return;

    const handleMessage = (event: MessageEvent) => {
      // Accept messages from shopee-clone origin
      const shopeeOrigin = new URL(SHOPEE_CLONE_URL).origin;
      if (event.origin !== shopeeOrigin) {
        return;
      }

      const { type, shop, token, error: errorMessage, message } = event.data;

      console.log('📨 Received message from Shopee-Clone:', { type, shop, hasToken: !!token, errorMessage });

      switch (type) {
        case 'SHOPEE_CLONE_AUTH_SUCCESS':
          if (shop && token) {
            setShopInfo(shop);
            setShopeeToken(token);
            setAuthStatus('authenticated');
            setShowLogin(false);
            setError(null);
          } else if (shop && !token) {
            setError('Authentication token is missing. Please try again.');
            setAuthStatus('not_authenticated');
            setShowLogin(true);
          }
          break;

        case 'SHOPEE_CLONE_AUTH_ERROR':
          setError(errorMessage || 'Authentication failed');
          setAuthStatus('not_authenticated');
          setShowLogin(true);
          break;

        case 'SHOPEE_CLONE_AUTH_REQUIRED':
          setAuthStatus('not_authenticated');
          setShowLogin(true);
          setError(null);
          break;

        default:
          console.log('Unknown message type:', type);
      }
    };

    window.addEventListener('message', handleMessage);

    // Check initial auth status after a short delay
    const timeout = setTimeout(() => {
      if (authStatus === 'checking' && !shopInfo) {
        setAuthStatus('not_authenticated');
        setShowLogin(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [open, authStatus, shopInfo, SHOPEE_CLONE_URL]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setAgreed(false);
      setError(null);
      setShopInfo(null);
      setShopeeToken(null);
      setShowLogin(false);
      setAuthStatus('checking');
    }
  }, [open]);

  const handleConnect = async () => {
    if (!agreed) {
      setError("Please agree to the terms to continue");
      return;
    }

    if (!shopInfo) {
      setError("Shop information is required. Please ensure you are logged in to Shopee-Clone.");
      return;
    }

    if (!shopeeToken) {
      setError("Authentication token is missing. Please grant permission in Shopee-Clone.");
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      await onConnect(shopInfo.id, shopInfo.name, shopeeToken);
      // Reset form on success
      setAgreed(false);
      setShopInfo(null);
      setShopeeToken(null);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to connect integration");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect Shopee-Clone Integration</DialogTitle>
          <DialogDescription>
            Connect your Shopee-Clone shop to sync products, orders, and analytics with BVA.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Shop Info Display */}
          {shopInfo && authStatus === 'authenticated' && (
            <Alert className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <Store className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong>Shop Detected:</strong> {shopInfo.name}
                <br />
                <span className="text-sm">We found your shop. Review the terms below to continue.</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Login Iframe */}
          {showLogin && authStatus === 'not_authenticated' && (
            <div className="space-y-2">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please login to your Shopee-Clone seller account to continue.
                </AlertDescription>
              </Alert>
              <div className="border rounded-lg overflow-hidden" style={{ height: '500px' }}>
                <iframe
                  ref={iframeRef}
                  src={`${SHOPEE_CLONE_URL}/bva-integration-check`}
                  className="w-full h-full border-0"
                  title="Shopee-Clone Login"
                />
              </div>
            </div>
          )}

          {/* Checking Status */}
          {authStatus === 'checking' && !showLogin && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Checking authentication status...</span>
            </div>
          )}

          {/* Agreement Terms - Only show when authenticated */}
          {shopInfo && authStatus === 'authenticated' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-base text-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                Integration Agreement
              </h4>
              <div className="space-y-3 text-sm text-muted-foreground bg-muted/50 p-5 rounded-lg max-h-64 overflow-y-auto border border-border/50">
                <p className="font-medium text-foreground">
                  By connecting Shopee-Clone, you agree to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Allow BVA to access your product catalog, sales data, and order information from <strong className="text-foreground">{shopInfo.name}</strong></li>
                  <li>Enable automatic synchronization of data between Shopee-Clone and BVA</li>
                  <li>Grant BVA permission to use your data for analytics, forecasting, and AI-powered recommendations</li>
                  <li>Understand that data will be processed securely and in accordance with our privacy policy</li>
                  <li>Your connection will use your authenticated session - no additional API keys required</li>
                </ul>
                <div className="mt-4 pt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">Note:</strong> You can disconnect this integration at any time from the Settings page.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Connection Info */}
          {shopInfo && authStatus === 'authenticated' && (
            <div className="space-y-2">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Simple Connection:</strong> This integration will use your authenticated session. 
                  No API keys needed - just click "Connect" to authorize BVA to access your Shopee-Clone data.
                </p>
              </div>
            </div>
          )}

          {/* Agreement Checkbox - Only show when authenticated */}
          {shopInfo && authStatus === 'authenticated' && (
            <div className="flex items-start gap-3 p-3 glass-card-sm rounded-lg border border-border/50">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={isConnecting}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="agree" className="text-sm text-foreground cursor-pointer flex-1">
                I have read and agree to the integration agreement terms above
              </label>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setAgreed(false);
                setError(null);
                setShopInfo(null);
                setShopeeToken(null);
                setShowLogin(false);
              }}
              disabled={isConnecting}
              className="gap-2"
            >
              Cancel
            </Button>
          {shopInfo && authStatus === 'authenticated' && (
            <Button
              onClick={handleConnect}
              disabled={!agreed || isConnecting}
              className="gap-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Connect Integration
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

