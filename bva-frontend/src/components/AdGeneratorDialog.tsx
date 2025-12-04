/**
 * Ad Generator Dialog Component
 * 
 * Modal for generating AI-powered ad copy and images
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, Image as ImageIcon, Copy, Check } from "lucide-react";
import { useGenerateAdCopy, useGenerateAdImage } from "@/hooks/useMarketMate";
import { toast } from "sonner";

interface AdGeneratorDialogProps {
  trigger?: React.ReactNode;
  onAdGenerated?: (adData: any) => void;
  initialProductName?: string;
  initialPlaybook?: "Flash Sale" | "New Arrival" | "Best Seller Spotlight" | "Bundle Up!";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AdGeneratorDialog({ 
  trigger, 
  onAdGenerated, 
  initialProductName = "", 
  initialPlaybook = "Flash Sale",
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: AdGeneratorDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const [productName, setProductName] = useState(initialProductName);
  const [playbook, setPlaybook] = useState<"Flash Sale" | "New Arrival" | "Best Seller Spotlight" | "Bundle Up!">(initialPlaybook);
  const [discount, setDiscount] = useState("");
  const [generatedAd, setGeneratedAd] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Update state when dialog opens or props change
  useEffect(() => {
    if (open) {
      if (initialProductName) setProductName(initialProductName);
      if (initialPlaybook) setPlaybook(initialPlaybook);
    }
  }, [open, initialProductName, initialPlaybook]);

  const generateAdCopyMutation = useGenerateAdCopy();
  const generateImageMutation = useGenerateAdImage();

  const handleGenerateAdCopy = async () => {
    if (!productName) {
      toast.error("Please enter a product name");
      return;
    }

    generateAdCopyMutation.mutate(
      { product_name: productName, playbook, discount: discount || undefined },
      {
        onSuccess: (response) => {
          setGeneratedAd(response.ad_copy);
          if (onAdGenerated) {
            onAdGenerated({
              productName,
              playbook,
              adCopy: response.ad_copy,
            });
          }
        },
      }
    );
  };

  const handleGenerateImage = async () => {
    if (!productName) {
      toast.error("Please enter a product name");
      return;
    }

    generateImageMutation.mutate(
      { product_name: productName, playbook },
      {
        onSuccess: (response) => {
          setImageUrl(response.image_url);
        },
      }
    );
  };

  const handleCopyToClipboard = () => {
    if (generatedAd) {
      navigator.clipboard.writeText(generatedAd);
      setCopied(true);
      toast.success("Ad copy copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setProductName("");
    setPlaybook("Flash Sale");
    setDiscount("");
    setGeneratedAd(null);
    setImageUrl(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-nav-active">
            <Sparkles className="h-4 w-4" />
            Generate New Campaign
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Ad Generator
          </DialogTitle>
          <DialogDescription>
            Create engaging ad copy and images for your products using AI
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Input Form */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                placeholder="e.g., Wireless Earbuds Pro"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="glass-card-sm border-card-glass-border"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="playbook">Campaign Playbook *</Label>
              <Select value={playbook} onValueChange={(value: any) => setPlaybook(value)}>
                <SelectTrigger className="glass-card-sm border-card-glass-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flash Sale">⚡ Flash Sale - Create urgency</SelectItem>
                  <SelectItem value="New Arrival">🆕 New Arrival - Launch excitement</SelectItem>
                  <SelectItem value="Best Seller Spotlight">🌟 Best Seller - Build trust</SelectItem>
                  <SelectItem value="Bundle Up!">📦 Bundle Up - Maximize value</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {playbook === "Flash Sale" && (
              <div className="grid gap-2">
                <Label htmlFor="discount">Discount (Optional)</Label>
                <Input
                  id="discount"
                  placeholder="e.g., 40% OFF or ₱500 OFF"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="glass-card-sm border-card-glass-border"
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerateAdCopy} 
                disabled={generateAdCopyMutation.isPending || !productName}
                className="flex-1 gap-2"
              >
                {generateAdCopyMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Copy...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Ad Copy
                  </>
                )}
              </Button>

              <Button 
                onClick={handleGenerateImage} 
                disabled={generateImageMutation.isPending || !productName}
                variant="outline"
                className="flex-1 gap-2"
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Generated Ad Copy */}
          {generatedAd && (
            <Card className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Generated Ad Copy</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={generatedAd}
                onChange={(e) => setGeneratedAd(e.target.value)}
                rows={6}
                className="glass-card-sm border-card-glass-border resize-none"
              />
            </Card>
          )}

          {/* Generated Image */}
          {imageUrl && (
            <Card className="glass-card p-4">
              <Label className="text-sm font-semibold mb-2 block">Generated Image</Label>
              <div className="relative aspect-square w-full max-w-md mx-auto rounded-lg overflow-hidden bg-muted">
                <img 
                  src={imageUrl} 
                  alt="Generated Ad" 
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          {(generatedAd || imageUrl) && (
            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button 
                onClick={() => {
                  toast.success("Campaign saved!");
                  setOpen(false);
                  handleReset();
                }}
              >
                Save Campaign
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
