/**
 * Ad Generator Dialog Component
 * 
 * Modal for generating AI-powered ad copy and images
 */

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, Image as ImageIcon, Copy, Check, Download, AlertCircle, Upload, X } from "lucide-react";
import { useGenerateAdCopy, useGenerateAdImage, useCreateCampaign, useUpdateCampaign } from "@/hooks/useMarketMate";
import { useAllUserProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

interface AdGeneratorDialogProps {
  trigger?: React.ReactNode;
  onAdGenerated?: (adData: any) => void;
  initialProductName?: string;
  initialPlaybook?: "Flash Sale" | "New Arrival" | "Best Seller Spotlight" | "Bundle Up!";
  initialProductId?: string; // Optional: Product ID to fetch image from
  initialProductImageUrl?: string; // Optional: Direct product image URL to use as context
  initialGeneratedImageUrl?: string; // Optional: Generated ad image URL (for editing existing campaigns)
  initialGeneratedAdCopy?: string; // Optional: Generated ad copy (for editing existing campaigns)
  initialShopId?: string; // Optional: Shop ID to fetch products for bundling
  editingCampaignId?: string; // Optional: Campaign ID if editing existing campaign
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
  initialGeneratedImageUrl, // Generated ad image (for editing)
  initialGeneratedAdCopy, // Generated ad copy (for editing)
  initialShopId,
  editingCampaignId,
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
  const [generatedAd, setGeneratedAd] = useState<string | null>(initialGeneratedAdCopy || null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialGeneratedImageUrl || null); // Generated ad image
  const [productImageUrl, setProductImageUrl] = useState<string | null>(initialProductImageUrl || null); // Original product image for regeneration
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedBundleProducts, setSelectedBundleProducts] = useState<string[]>([]);
  const [customImagePrompt, setCustomImagePrompt] = useState("");
  const [selectedTemplateContexts, setSelectedTemplateContexts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch all products for bundling
  const { data: allProducts } = useAllUserProducts();
  const { user } = useAuth();
  
  // Determine the shopId to use - try initialShopId first, then find from product
  const effectiveShopId = useMemo(() => {
    if (initialShopId) return initialShopId;
    // If no shopId provided, try to find it from the product in the list
    if (initialProductId && allProducts) {
      const product = allProducts.find(p => p.id === initialProductId);
      if (product?.shopId) {
        console.log("🔍 Found shopId from product:", product.shopId);
        return product.shopId;
      }
    }
    return null;
  }, [initialShopId, initialProductId, allProducts]);

  // Determine the platform from product or shop
  const effectivePlatform = useMemo(() => {
    // First, try to get platform from the product
    if (initialProductId && allProducts) {
      const product = allProducts.find(p => p.id === initialProductId);
      if (product?.platform) {
        console.log("🔍 Found platform from product:", product.platform);
        return product.platform.toUpperCase();
      }
    }
    
    // If no product platform, try to get from shop
    if (effectiveShopId && user?.shops) {
      const shop = user.shops.find(s => s.id === effectiveShopId);
      if (shop && 'platform' in shop && shop.platform) {
        console.log("🔍 Found platform from shop:", shop.platform);
        return (shop.platform as string).toUpperCase();
      }
    }
    
    // Default to SHOPEE if no platform found
    console.log("⚠️ No platform found, defaulting to SHOPEE");
    return "SHOPEE";
  }, [initialProductId, allProducts, effectiveShopId, user]);
  
  // Filter products from the same shop, excluding the current product
  const availableBundleProducts = useMemo(() => {
    if (!allProducts || !effectiveShopId) {
      console.log("🔍 Bundle products filter:", {
        hasProducts: !!allProducts,
        productsCount: allProducts?.length || 0,
        initialShopId,
        effectiveShopId,
        initialProductId,
      });
      return [];
    }
    
    const filtered = allProducts.filter(
      (p) => p.shopId === effectiveShopId && p.id !== initialProductId && p.name
    );
    
    console.log("🔍 Bundle products filter result:", {
      totalProducts: allProducts.length,
      filteredCount: filtered.length,
      effectiveShopId,
      initialProductId,
      allProductShopIds: allProducts.map(p => ({ id: p.id, name: p.name, shopId: p.shopId })),
      filteredProducts: filtered.map(p => ({ id: p.id, name: p.name, shopId: p.shopId })),
    });
    
    return filtered;
  }, [allProducts, effectiveShopId, initialProductId]);

  // Update state when dialog opens or props change
  useEffect(() => {
    if (open) {
      if (initialProductName) setProductName(initialProductName);
      if (initialPlaybook) setPlaybook(initialPlaybook);
      // Reset bundle products when dialog opens
      setSelectedBundleProducts([]);
      // Reset custom prompt and template context when dialog opens
      setCustomImagePrompt("");
      setSelectedTemplateContexts([]);
      // Ensure productImageUrl is set from initial value for regeneration
      if (initialProductImageUrl) {
        setProductImageUrl(initialProductImageUrl);
      }
      // When editing, load the existing generated image and ad copy
      if (editingCampaignId) {
        if (initialGeneratedImageUrl) {
          setImageUrl(initialGeneratedImageUrl);
        }
        if (initialGeneratedAdCopy) {
          setGeneratedAd(initialGeneratedAdCopy);
        }
      } else {
        // When creating new, reset generated image (but keep product image)
        if (!initialGeneratedImageUrl) {
          setImageUrl(null);
        }
        if (!initialGeneratedAdCopy) {
          setGeneratedAd(null);
        }
      }
      // Note: productId and productImageUrl are used directly in handleGenerateImage
      // They don't need to be stored in state
    }
  }, [open, initialProductName, initialPlaybook, initialProductImageUrl, initialGeneratedImageUrl, initialGeneratedAdCopy, editingCampaignId]);

  const generateAdCopyMutation = useGenerateAdCopy();
  const generateImageMutation = useGenerateAdImage();
  const createCampaignMutation = useCreateCampaign();
  const updateCampaignMutation = useUpdateCampaign();
  const queryClient = useQueryClient();
  
  const isEditing = !!editingCampaignId;

  const handleGenerateAdCopy = async () => {
    if (!productName) {
      toast.error("Please enter a product name");
      return;
    }

    // For bundle playbook, include bundle products in the product name
    let productNameForAd = productName;
    if (playbook === "Bundle Up!" && selectedBundleProducts.length > 0) {
      const bundleProductNames = selectedBundleProducts
        .map((id) => {
          const product = availableBundleProducts.find((p) => p.id === id);
          return product?.name;
        })
        .filter(Boolean)
        .join(", ");
      if (bundleProductNames) {
        productNameForAd = `${productName} + ${bundleProductNames}`;
      }
    }

    // Get the product image URL for image-based ad copy generation
    const contextImageUrl = uploadedImage || productImageUrl || initialProductImageUrl;
    
    setIsGenerating(true);
    generateAdCopyMutation.mutate(
      { 
        product_name: productNameForAd, 
        playbook, 
        discount: discount || undefined,
        product_image_url: contextImageUrl || undefined, // Pass product image for vision analysis
      },
      {
        onSuccess: (response) => {
          setIsGenerating(false);
          setGeneratedAd(response.ad_copy);
          
          // Show notification even if modal is closed
          if (!open) {
            toast.success("Ad Copy Generated!", {
              description: `Ad copy for ${productName} is ready`,
              duration: 5000,
            });
          }
          
          // Don't call onAdGenerated when just generating - only on save
        },
        onError: () => {
          setIsGenerating(false);
        }
      }
    );
  };

  // Helper function to compress image
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      try {
        toast.loading("Compressing image...", { id: "image-upload" });
        
        // Compress the image before converting to base64
        const compressedDataUrl = await compressImage(file, 1920, 1920, 0.85);
        
        // Check if compressed size is still reasonable (max 15MB base64)
        if (compressedDataUrl.length > 15 * 1024 * 1024) {
          toast.error("Image is too large even after compression. Please use a smaller image.", { id: "image-upload" });
          return;
        }

        // Validate the compressed data URL format
        if (!compressedDataUrl || !compressedDataUrl.startsWith('data:image/')) {
          toast.error("Failed to process image: Invalid format", { id: "image-upload" });
          return;
        }
        
        console.log("✅ Image uploaded successfully:", {
          format: compressedDataUrl.substring(0, 30),
          size: compressedDataUrl.length,
          sizeKB: Math.round(compressedDataUrl.length / 1024)
        });
        
        setUploadedImage(compressedDataUrl);
        setProductImageUrl(compressedDataUrl);
        toast.success("Image uploaded and compressed successfully!", { id: "image-upload" });
      } catch (error) {
        console.error("❌ Error compressing image:", error);
        toast.error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: "image-upload" });
      }
    }
  };

  const handleRemoveUploadedImage = () => {
    setUploadedImage(null);
    setProductImageUrl(initialProductImageUrl || null);
  };

  const handleGenerateImage = async () => {
    if (!productName) {
      toast.error("Please enter a product name");
      return;
    }

    // Use uploaded image, product image URL, or initial product image
    const contextImageUrl = uploadedImage || productImageUrl || initialProductImageUrl;
    
    // Require product image from inventory/SmartShelf or upload
    if (!contextImageUrl && !initialProductId) {
      toast.error("Product image is required. Please upload an image or select a product from inventory or SmartShelf.");
      return;
    }
    
    console.log("🎨 Generating ad image with product context:", {
      productName,
      playbook,
      hasProductId: !!initialProductId,
      hasProductImage: !!contextImageUrl,
      hasUploadedImage: !!uploadedImage,
      hasProductImageUrl: !!productImageUrl,
      hasInitialProductImageUrl: !!initialProductImageUrl,
      hasCustomPrompt: !!customImagePrompt,
      hasTemplateContext: selectedTemplateContexts.length > 0,
      imageUrlFormat: contextImageUrl ? contextImageUrl.substring(0, 50) : 'none',
      imageUrlLength: contextImageUrl ? contextImageUrl.length : 0,
    });

    // Combine selected template contexts into a single string
    const combinedTemplateContext = selectedTemplateContexts.length > 0
      ? selectedTemplateContexts.join(". ")
      : undefined;

    setIsGenerating(true);
    generateImageMutation.mutate(
      { 
        product_name: productName, 
        playbook,
        productId: initialProductId, // Pass product ID so backend can fetch image
        product_image_url: contextImageUrl, // Pass product image URL directly - REQUIRED
        custom_prompt: customImagePrompt || undefined, // Custom prompt for image editing
        template_context: combinedTemplateContext, // Optional template context
      },
      {
        onSuccess: (response) => {
          setIsGenerating(false);
          if (response.image_url) {
            // Validate the image URL format
            if (response.image_url.startsWith('data:image') || response.image_url.startsWith('http')) {
              setImageUrl(response.image_url);
              
              // Preserve the original product image URL for future regenerations
              // Store the product image URL that was used for this generation
              const currentProductImage = uploadedImage || productImageUrl || initialProductImageUrl;
              if (currentProductImage) {
                // Always update to ensure we have the product image for regeneration
                setProductImageUrl(currentProductImage);
              }
              
              // Show notification even if modal is closed
              if (!open) {
                if (response.warning) {
                  toast.warning("Image Generated", {
                    description: response.warning,
                    duration: 5000,
                  });
                } else {
                  toast.success("Image Generated Successfully!", {
                    description: `Ad image for ${productName} is ready`,
                    duration: 5000,
                  });
                }
              }
              
              // Don't call onAdGenerated when just generating - only on save
              
              // Toast notification is handled by useGenerateAdImage hook
              // which checks for warnings and shows appropriate message
            } else {
              toast.error("Invalid image format received");
              console.error("Invalid image URL:", response.image_url.substring(0, 100));
            }
          } else {
            toast.error("No image URL in response");
          }
        },
        onError: (error: any) => {
          setIsGenerating(false);
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
    setSelectedBundleProducts([]);
    setUploadedImage(null);
    setCustomImagePrompt("");
    setSelectedTemplateContexts([]);
  };

  // Prevent closing dialog during generation
  const handleOpenChange = (newOpen: boolean) => {
    // Don't allow closing if generation is in progress
    if (!newOpen && (generateAdCopyMutation.isPending || generateImageMutation.isPending || createCampaignMutation.isPending)) {
      toast.info("Please wait for generation to complete before closing");
      return;
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            {initialProductImageUrl ? (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-green-500/20">
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
                  <p className="text-sm font-medium">Product Image (Required)</p>
                  <p className="text-xs text-muted-foreground">
                    This image from inventory will be used as the basis for ad generation
                  </p>
                </div>
              </div>
            ) : !initialProductId ? (
              <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/30">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-400">Product Image Required</p>
                  <p className="text-xs text-muted-foreground">
                    Please select a product from inventory or SmartShelf to generate ad images
                  </p>
                </div>
              </div>
            ) : null}
            
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

            {/* Image Upload Section */}
            <div className="grid gap-2">
              <Label htmlFor="imageUpload">
                Upload Product Image {!initialProductImageUrl && !initialProductId ? "(Required)" : "(Optional)"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="glass-card-sm border-card-glass-border"
                />
                {uploadedImage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveUploadedImage}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {uploadedImage && (
                <div className="mt-2">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded" 
                    className="w-32 h-32 object-cover rounded border"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {!initialProductImageUrl && !initialProductId 
                  ? "Upload a product image to generate ads. This image will be used for both ad copy and image generation."
                  : "Upload an image to use instead of the product inventory image"}
              </p>
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

            {playbook === "Bundle Up!" && initialShopId && (
              <div className="grid gap-2">
                <Label>Select Products to Bundle With (Optional)</Label>
                <Card className="glass-card-sm p-4 max-h-48 overflow-y-auto">
                  {availableBundleProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No other products available in this shop for bundling.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {availableBundleProducts.map((product) => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`bundle-${product.id}`}
                            checked={selectedBundleProducts.includes(product.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBundleProducts([...selectedBundleProducts, product.id]);
                              } else {
                                setSelectedBundleProducts(
                                  selectedBundleProducts.filter((id) => id !== product.id)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`bundle-${product.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {product.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                {selectedBundleProducts.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedBundleProducts.length} product(s) selected for bundle
                  </p>
                )}
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
                disabled={
                  generateImageMutation.isPending || 
                  !productName || 
                  (!uploadedImage && !initialProductImageUrl && !initialProductId)
                }
                variant="outline"
                className="flex-1 gap-2"
                title={
                  (!uploadedImage && !initialProductImageUrl && !initialProductId) 
                    ? "Product image from inventory or upload is required" 
                    : undefined
                }
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
                <div className="flex gap-2">
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
              </div>
              <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden bg-muted border border-card-glass-border mb-4">
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
              
              {/* Custom Prompt and Template Context for Image Editing */}
              <div className="grid gap-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="customImagePrompt">Edit Image with Custom Prompt (Optional)</Label>
                  <Textarea
                    id="customImagePrompt"
                    placeholder="e.g., Add a blue background, make the product larger, add sparkles around it..."
                    value={customImagePrompt}
                    onChange={(e) => setCustomImagePrompt(e.target.value)}
                    className="glass-card-sm border-card-glass-border"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    Provide instructions to modify the generated image
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Template Context (Optional)</Label>
                  
                  {/* Predefined Template Context Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "Festive Decorations", value: "Add festive holiday decorations and celebratory elements" },
                      { label: "Warm Colors", value: "Use warm, inviting colors like red, orange, and gold" },
                      { label: "Sparkles & Glitter", value: "Add sparkles, glitter effects, and shimmer" },
                      { label: "Gift Wrapping", value: "Include gift wrapping, ribbons, and bow elements" },
                      { label: "Modern Minimalist", value: "Clean, minimalist design with plenty of white space" },
                      { label: "Bold & Vibrant", value: "Use bold, vibrant colors with high contrast" },
                      { label: "Premium Luxury", value: "Premium, luxurious aesthetic with elegant details" },
                      { label: "Playful & Fun", value: "Playful, fun design with whimsical elements" },
                      { label: "Professional", value: "Professional, corporate style with clean lines" },
                      { label: "Nature Theme", value: "Incorporate natural elements like leaves, flowers, or wood textures" },
                    ].map((preset) => {
                      const isSelected = selectedTemplateContexts.includes(preset.value);
                      return (
                        <Button
                          key={preset.label}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            if (isSelected) {
                              // Remove if already selected
                              setSelectedTemplateContexts(prev => 
                                prev.filter(v => v !== preset.value)
                              );
                            } else {
                              // Add if not selected
                              setSelectedTemplateContexts(prev => [...prev, preset.value]);
                            }
                          }}
                          className={`text-xs h-8 ${isSelected ? "bg-primary text-primary-foreground" : ""}`}
                        >
                          {preset.label}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click buttons to select template context options. Selected options will be applied when regenerating the image.
                  </p>
                </div>

                {(customImagePrompt || selectedTemplateContexts.length > 0) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!productName) {
                        toast.error("Please enter a product name");
                        return;
                      }
                      // For regeneration, we need the original product image, not the generated ad image
                      // Always use the original product image sources, never the generated ad image
                      const contextImageUrl = uploadedImage || productImageUrl || initialProductImageUrl;
                      
                      console.log("🔄 Regenerating image with:", {
                        productName,
                        playbook,
                        hasCustomPrompt: !!customImagePrompt,
                        hasTemplateContext: selectedTemplateContexts.length > 0,
                        contextImageUrl: contextImageUrl?.substring(0, 50),
                        hasProductId: !!initialProductId,
                        hasUploadedImage: !!uploadedImage,
                        hasProductImageUrl: !!productImageUrl,
                        hasInitialProductImageUrl: !!initialProductImageUrl,
                      });
                      
                      // Combine selected template contexts
                      const combinedTemplateContext = selectedTemplateContexts.length > 0
                        ? selectedTemplateContexts.join(". ")
                        : undefined;
                      
                      // Ensure we have a valid product image URL
                      if (!contextImageUrl && !initialProductId) {
                        toast.error("Product image is required for regeneration. Please upload an image or ensure a product image is available.");
                        return;
                      }
                      
                      // Validate we have a product image URL before making the request
                      if (!contextImageUrl && !initialProductId) {
                        toast.error("Product image is required for regeneration. Please ensure a product image is available.");
                        return;
                      }
                      
                      setIsGenerating(true);
                      generateImageMutation.mutate(
                        { 
                          product_name: productName, 
                          playbook,
                          productId: initialProductId || undefined,
                          product_image_url: contextImageUrl || undefined, // Always use original product image, not generated ad image
                          custom_prompt: customImagePrompt || undefined,
                          template_context: combinedTemplateContext || undefined,
                        },
                        {
                          onSuccess: (response) => {
                            setIsGenerating(false);
                            if (response.image_url) {
                              if (response.image_url.startsWith('data:image') || response.image_url.startsWith('http')) {
                                setImageUrl(response.image_url);
                                
                                // Show notification even if modal is closed
                                if (!open) {
                                  if (response.warning) {
                                    toast.warning("Image Regenerated", {
                                      description: response.warning,
                                      duration: 5000,
                                    });
                                  } else {
                                    toast.success("Image Regenerated!", {
                                      description: `Ad image for ${productName} has been updated`,
                                      duration: 5000,
                                    });
                                  }
                                } else {
                                  // Show specific message for regeneration if no warning
                                  if (!response.warning) {
                                    toast.success("Image regenerated with custom prompt!");
                                  }
                                }
                                
                                // Don't call onAdGenerated when just regenerating - only on save
                                
                                // Note: Warning toast is handled by useGenerateAdImage hook
                              } else {
                                toast.error("Invalid image format received");
                              }
                            } else {
                              toast.error("No image URL in response");
                            }
                          },
                          onError: (error: any) => {
                            setIsGenerating(false);
                            const errorMessage = error?.response?.data?.detail || error?.message || "Failed to regenerate image";
                            toast.error(`Image regeneration failed: ${errorMessage}`);
                          }
                        }
                      );
                    }}
                    disabled={generateImageMutation.isPending}
                    className="w-full"
                  >
                    {generateImageMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Regenerate Image with Prompt
                      </>
                    )}
                  </Button>
                )}
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
                    if (isEditing && editingCampaignId) {
                      // Update existing campaign
                      // Get the original product image URL (not the generated ad image)
                      const originalProductImageUrl = uploadedImage || productImageUrl || initialProductImageUrl;
                      
                      await updateCampaignMutation.mutateAsync({
                        id: editingCampaignId,
                        data: {
                          content: {
                            ad_copy: generatedAd || "",
                            promo_copy: generatedAd || "",
                            playbook,
                            product_name: productName,
                            image_url: imageUrl || undefined, // Generated ad image
                            product_image_url: originalProductImageUrl || undefined, // Original product image for regeneration
                          },
                        },
                      });
                    } else {
                      // Create new campaign
                      // Get the original product image URL (not the generated ad image)
                      const originalProductImageUrl = uploadedImage || productImageUrl || initialProductImageUrl;
                      
                    await createCampaignMutation.mutateAsync({
                      name: `${productName} - ${playbook}`,
                      content: {
                        ad_copy: generatedAd || "",
                        promo_copy: generatedAd || "",
                        playbook,
                        product_name: productName,
                          image_url: imageUrl || undefined, // Generated ad image
                          product_image_url: originalProductImageUrl || undefined, // Original product image for regeneration
                      },
                      status: "DRAFT",
                      platform: effectivePlatform,
                    });
                    }

                    // Invalidate campaigns query to refresh the list
                    queryClient.invalidateQueries({ queryKey: ["campaigns"] });

                    toast.success(isEditing ? "Campaign updated!" : "Campaign saved!", {
                      description: `${productName} - ${playbook} campaign has been ${isEditing ? "updated" : "saved"}`,
                      duration: 5000,
                    });
                    
                    // Only close and reset if creating new campaign (not editing)
                    if (!isEditing && !isGenerating) {
                    setOpen(false);
                    handleReset();
                    } else if (isEditing) {
                      // When editing, keep modal open but refresh data
                      // Don't reset - allow user to continue editing
                    }
                    
                    if (onAdGenerated) {
                      onAdGenerated({
                        productName,
                        playbook,
                        adCopy: generatedAd,
                        imageUrl,
                        isEditing,
                      });
                    }
                  } catch (error) {
                    // Error toast is handled by the mutation
                  }
                }}
                disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
              >
                {(createCampaignMutation.isPending || updateCampaignMutation.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditing ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  isEditing ? "Update Campaign" : "Save Campaign"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
