/**
 * Prompt Suggestion Modal Component
 * 
 * Provides AI-powered suggestions for better ad prompts based on:
 * - Product image analysis
 * - Desired result type
 * - General prompt improvement tips
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Loader2, 
  Image as ImageIcon, 
  Sparkles, 
  Copy, 
  Check, 
  Eye,
  Target,
  TrendingUp,
  Palette,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { adsService } from "@/services/ads.service";

interface PromptSuggestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  productImageUrl?: string;
  currentPrompt?: string;
  playbook?: string;
  onSuggestionSelected?: (suggestion: string) => void;
}

type ResultType = "attention" | "conversion" | "engagement" | "brand" | "urgency" | null;

export function PromptSuggestionModal({
  open,
  onOpenChange,
  productName = "",
  productImageUrl,
  currentPrompt = "",
  playbook = "Flash Sale",
  onSuggestionSelected
}: PromptSuggestionModalProps) {
  const [selectedResultType, setSelectedResultType] = useState<ResultType>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    imageBased?: string[];
    resultBased?: string[];
    general?: string[];
  }>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const resultTypes = [
    { id: "attention" as const, label: "Grab Attention", icon: Eye, description: "Stand out in crowded feeds" },
    { id: "conversion" as const, label: "Drive Sales", icon: Target, description: "Encourage immediate purchase" },
    { id: "engagement" as const, label: "Boost Engagement", icon: TrendingUp, description: "Get likes, shares, comments" },
    { id: "brand" as const, label: "Build Brand", icon: Palette, description: "Reinforce brand identity" },
    { id: "urgency" as const, label: "Create Urgency", icon: Zap, description: "Prompt quick action" },
  ];

  const handleAnalyzeImage = async () => {
    if (!productImageUrl) {
      toast.error("Product image is required for analysis");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await adsService.getPromptSuggestions({
        product_name: productName || "Product",
        product_image_url: productImageUrl,
        playbook: playbook,
        current_prompt: currentPrompt,
        result_type: selectedResultType || undefined
      });

      setSuggestions({
        imageBased: result.image_based_suggestions || [],
        resultBased: result.result_based_suggestions || [],
        general: result.general_tips || []
      });

      toast.success("Analysis complete! Check suggestions below.");
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      toast.error(error?.response?.data?.detail || "Failed to analyze image. Using general suggestions.");
      
      // Fallback to general suggestions
      setSuggestions({
        general: [
          "Use specific product features and benefits",
          "Include emotional triggers relevant to your audience",
          "Add visual elements that complement the product",
          "Consider your target audience's preferences",
          "Use action-oriented language"
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGetResultBasedSuggestions = async () => {
    if (!selectedResultType) {
      toast.error("Please select a desired result type");
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await adsService.getPromptSuggestions({
        product_name: productName || "Product",
        product_image_url: productImageUrl,
        playbook: playbook,
        current_prompt: currentPrompt,
        result_type: selectedResultType
      });

      setSuggestions(prev => ({
        ...prev,
        resultBased: result.result_based_suggestions || []
      }));

      toast.success("Suggestions generated!");
    } catch (error: any) {
      console.error("Error getting suggestions:", error);
      toast.error("Failed to get suggestions");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopySuggestion = (suggestion: string, index: number) => {
    navigator.clipboard.writeText(suggestion);
    setCopiedIndex(index);
    toast.success("Suggestion copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleUseSuggestion = (suggestion: string) => {
    if (onSuggestionSelected) {
      onSuggestionSelected(suggestion);
      onOpenChange(false);
      toast.success("Suggestion applied!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI Prompt Suggestions
          </DialogTitle>
          <DialogDescription>
            Get AI-powered suggestions to improve your ad prompts based on your product image or desired results
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          {(productName || productImageUrl) && (
            <Card className="glass-card-sm p-4">
              <div className="flex items-center gap-4">
                {productImageUrl && (
                  <img 
                    src={productImageUrl} 
                    alt={productName || "Product"} 
                    className="w-20 h-20 object-cover rounded-lg border"
                  />
                )}
                <div>
                  <p className="font-semibold text-foreground">{productName || "Product"}</p>
                  <p className="text-sm text-muted-foreground">Playbook: {playbook}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Analysis Options */}
          <div className="grid gap-4">
            {/* Image Analysis */}
            {productImageUrl && (
              <Card className="glass-card-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">Image-Based Suggestions</Label>
                  </div>
                  <Button
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzing}
                    size="sm"
                    className="gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  AI will analyze your product image and suggest improvements to make your ad more effective
                </p>
                {suggestions.imageBased && suggestions.imageBased.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {suggestions.imageBased.map((suggestion, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50"
                      >
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{suggestion}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopySuggestion(suggestion, `image-${index}`)}
                            className="h-7 w-7 p-0"
                          >
                            {copiedIndex === `image-${index}` ? (
                              <Check className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUseSuggestion(suggestion)}
                            className="h-7 text-xs"
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Result-Based Suggestions */}
            <Card className="glass-card-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5 text-primary" />
                <Label className="text-base font-semibold">Result-Based Suggestions</Label>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Select what you want to achieve with your ad to get targeted suggestions
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                {resultTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedResultType === type.id;
                  return (
                    <Button
                      key={type.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-auto p-3 flex flex-col items-center gap-2 ${isSelected ? "bg-primary text-primary-foreground" : ""}`}
                      onClick={() => setSelectedResultType(isSelected ? null : type.id)}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="text-center">
                        <p className="text-xs font-semibold">{type.label}</p>
                        <p className="text-[10px] opacity-80">{type.description}</p>
                      </div>
                    </Button>
                  );
                })}
              </div>

              {selectedResultType && (
                <Button
                  onClick={handleGetResultBasedSuggestions}
                  disabled={isAnalyzing}
                  className="w-full gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating Suggestions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Get Suggestions for {resultTypes.find(t => t.id === selectedResultType)?.label}
                    </>
                  )}
                </Button>
              )}

              {suggestions.resultBased && suggestions.resultBased.length > 0 && (
                <div className="space-y-2 mt-4">
                  {suggestions.resultBased.map((suggestion, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-border/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{suggestion}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopySuggestion(suggestion, `result-${index}`)}
                          className="h-7 w-7 p-0"
                        >
                          {copiedIndex === `result-${index}` ? (
                            <Check className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUseSuggestion(suggestion)}
                          className="h-7 text-xs"
                        >
                          Use
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* General Tips */}
            {suggestions.general && suggestions.general.length > 0 && (
              <Card className="glass-card-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <Label className="text-base font-semibold">General Tips</Label>
                </div>
                <div className="space-y-2">
                  {suggestions.general.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg"
                    >
                      <Badge variant="outline" className="mt-0.5">Tip {index + 1}</Badge>
                      <p className="text-sm text-foreground flex-1">{tip}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Quick Start - Show general tips if no analysis done */}
            {!suggestions.imageBased && !suggestions.resultBased && !suggestions.general && (
              <Card className="glass-card-sm p-4 border-dashed">
                <div className="text-center py-4">
                  <Lightbulb className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {productImageUrl 
                      ? "Click 'Analyze Image' to get AI-powered suggestions based on your product image"
                      : "Upload a product image or select a result type to get personalized suggestions"}
                  </p>
                  {productImageUrl && (
                    <Button onClick={handleAnalyzeImage} disabled={isAnalyzing} className="gap-2">
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Get Started - Analyze Image
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

