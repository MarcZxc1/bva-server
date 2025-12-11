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
import { Sparkles, Loader2, Image as ImageIcon, Copy, Check, Download } from "lucide-react";
import { useGenerateAdCopy, useGenerateAdImage, useCreateCampaign } from "@/hooks/useMarketMate";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface AdGeneratorDialogProps {
  trigger?: React.ReactNode;
  onAdGenerated?: (adData: any) => void;
  initialProductName?: string;
  initialPlaybook?: "Flash Sale" | "New Arrival" | "Best Seller Spotlight" | "Bundle Up!";
  initialProductId?: string; // Optional: Product ID to fetch image from
  initialProductImageUrl?: string; // Optional: Direct product image URL to use as context
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AdGeneratorDialog({ 
  trigger, 
  onAdGenerated, 
  initialProductName = "", 
  initialPlaybook = "Flash Sale",
  initialProductId,
  initialProductImageUrl,
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
      // Note: productId and productImageUrl are used directly in handleGenerateImage
      // They don't need to be stored in state
    }
  }, [open, initialProductName, initialPlaybook]);

  const generateAdCopyMutation = useGenerateAdCopy();
  const generateImageMutation = useGenerateAdImage();
  const createCampaignMutation = useCreateCampaign();
  const queryClient = useQueryClient();

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

    // Use product image URL if available (from props or state)
    const productImageUrl = initialProductImageUrl;
    
    console.log("🎨 Generating ad image with product context:", {
      productName,
      playbook,
      hasProductId: !!initialProductId,
      hasProductImage: !!productImageUrl,
    });

    generateImageMutation.mutate(
      { 
        product_name: productName, 
        playbook,
        productId: initialProductId, // Pass product ID so backend can fetch image
        product_image_url: productImageUrl, // Pass product image URL directly
      },
      {
        onSuccess: (response) => {
          if (response.image_url) {
            // Validate the image URL format
            if (response.image_url.startsWith('data:image') || response.image_url.startsWith('http')) {
              setImageUrl(response.image_url);
              toast.success("Image generated successfully!");
            } else {
              toast.error("Invalid image format received");
              console.error("Invalid image URL:", response.image_url.substring(0, 100));
            }
          } else {
            toast.error("No image URL in response");
          }
        },
        onError: (error: any) => {
          const errorMessage = error?.response?.data?.detail || error?.message || "Failed to generate image";
          toast.error(`Image generation failed: ${errorMessage}`);
          console.error("Image generation error:", error);
        }
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
            {/* Show product image if available */}
            {initialProductImageUrl && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <img 
                  src={initialProductImageUrl} 
                  alt={productName || "Product"} 
                  className="w-16 h-16 object-cover rounded border"
                  onError={(e) => {
                    console.warn("Failed to load product image:", initialProductImageUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Product Image</p>
                  <p className="text-xs text-muted-foreground">
                    This image will be used as context for ad generation
                  </p>
                </div>
              </div>
            )}
            
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
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Generated Image</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Download image functionality
                    try {
                      // Create a temporary anchor element
                      const link = document.createElement('a');
                      link.href = imageUrl;
                      link.download = `ad-image-${productName.replace(/\s+/g, '-')}-${Date.now()}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success("Image downloaded successfully!");
                    } catch (error) {
                      console.error("Error downloading image:", error);
                      toast.error("Failed to download image");
                    }
                  }}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
              <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden bg-muted border border-card-glass-border">
                <img 
                  src={imageUrl} 
                  alt="Generated Ad" 
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    console.error("Image load error:", e);
                    toast.error("Failed to load generated image");
                    setImageUrl(null);
                  }}
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
                onClick={async () => {
                  if (!generatedAd && !imageUrl) {
                    toast.error("Please generate ad copy or image first");
                    return;
                  }

                  try {
                    await createCampaignMutation.mutateAsync({
                      name: `${productName} - ${playbook}`,
                      content: {
                        ad_copy: generatedAd || "",
                        promo_copy: generatedAd || "",
                        playbook,
                        product_name: productName,
                        image_url: imageUrl || undefined,
                      },
                      status: "DRAFT",
                      platform: "SHOPEE",
                    });

                    // Invalidate campaigns query to refresh the list
                    queryClient.invalidateQueries({ queryKey: ["campaigns"] });

                    toast.success("Campaign saved!");
                    setOpen(false);
                    handleReset();
                    
                    if (onAdGenerated) {
                      onAdGenerated({
                        productName,
                        playbook,
                        adCopy: generatedAd,
                        imageUrl,
                      });
                    }
                  } catch (error) {
                    // Error toast is handled by the mutation
                  }
                }}
                disabled={createCampaignMutation.isPending}
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Campaign"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
