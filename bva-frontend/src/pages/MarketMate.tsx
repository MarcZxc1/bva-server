import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Megaphone, Sparkles, Calendar, Eye, TrendingUp, Loader2, Lightbulb, PackageOpen, Package, BarChart3, Download, Image as ImageIcon, Copy, Facebook, CheckCircle2, XCircle, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { AdGeneratorDialog } from "@/components/AdGeneratorDialog";
import { usePromotions, useCampaigns, useCreateCampaign, useScheduleCampaign, usePublishCampaign, useUnscheduleCampaign, useDeleteCampaign } from "@/hooks/useMarketMate";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialMediaApi } from "@/lib/api";
import { signInWithFacebook, getSession, onAuthStateChange } from "@/lib/supabase";

const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "default";
    case "scheduled":
      return "secondary";
    case "draft":
      return "outline";
    default:
      return "secondary";
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case "Shopee":
      return "glass-card-sm text-primary border-primary/20";
    case "Lazada":
      return "glass-card-sm text-primary border-primary/20";
    case "TikTok":
      return "glass-card-sm text-primary border-primary/20";
    default:
      return "glass-card-sm text-muted-foreground border-card-glass-border";
  }
};

export default function MarketMate() {
  const { user } = useAuth();
  const location = useLocation();
  const shopId = user?.shops?.[0]?.id || "";
  const { data: promotionsData, isLoading: promotionsLoading } = usePromotions(shopId, !!shopId);
  const { data: campaignsData, isLoading: campaignsLoading, refetch: refetchCampaigns } = useCampaigns(shopId, !!shopId);
  const createCampaignMutation = useCreateCampaign();
  const scheduleCampaignMutation = useScheduleCampaign();
  const publishCampaignMutation = usePublishCampaign();
  const unscheduleCampaignMutation = useUnscheduleCampaign();
  const deleteCampaignMutation = useDeleteCampaign();
  const queryClient = useQueryClient();

  const [previewPromo, setPreviewPromo] = useState<any>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [schedulingCampaign, setSchedulingCampaign] = useState<any>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>("");
  const [selectedHour, setSelectedHour] = useState<number>(1);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedAmPm, setSelectedAmPm] = useState<"AM" | "PM">("PM");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [viewingCampaign, setViewingCampaign] = useState<any>(null);
  const [isConnectingFacebook, setIsConnectingFacebook] = useState(false);

  const campaigns = campaignsData || [];
  const hasCampaigns = campaigns && campaigns.length > 0;
  const hasPromotions = promotionsData && promotionsData.promotions.length > 0;

  // Check Facebook connection status
  const { data: facebookAccount, refetch: refetchFacebook, isLoading: isLoadingFacebook } = useQuery({
    queryKey: ["facebookAccount"],
    queryFn: async () => {
      try {
        const response = await socialMediaApi.getFacebookAccount();
        console.log("📱 Facebook Account Response:", response);
        
        // apiClient.get unwraps the response, so response IS the data object
        // Backend returns: { success: true, data: { id, platform, pageId, accountId, expiresAt, isConnected } }
        // apiClient.get returns: { id, platform, pageId, accountId, expiresAt, isConnected }
        const accountData = response;
        
        // Ensure we always return an object, never undefined
        if (!accountData) {
          console.log("📱 Facebook Account: No data in response");
          return { isConnected: false, pageId: null, platform: 'facebook' };
        }
        
        // Check if this is a wrapped response (shouldn't happen, but handle it)
        if (accountData && 'success' in accountData && accountData.success === false) {
          console.log("📱 Facebook Account: Response indicates not connected");
          return { isConnected: false, pageId: null, platform: 'facebook' };
        }
        
        // The apiClient unwraps the response, so accountData is the data object directly
        // Check if it has the expected structure
        const hasPageId = !!accountData.pageId;
        const isConnected = accountData.isConnected !== undefined 
          ? accountData.isConnected 
          : hasPageId; // Fallback: if isConnected not set, use pageId as indicator
        
        console.log("📱 Processed Account Data:", {
          hasPageId,
          isConnected,
          pageId: accountData.pageId,
          accountId: accountData.accountId,
        });
        
        // Return the account data with isConnected flag
        return {
          ...accountData,
          isConnected: isConnected && hasPageId, // Must have both
        };
      } catch (error: any) {
        if (error?.response?.status === 404) {
          console.log("📱 Facebook Account: Not connected (404)");
          return { isConnected: false, pageId: null, platform: 'facebook' }; // Return object, not null
        }
        console.error("📱 Facebook Account: Error fetching", error);
        return { isConnected: false, pageId: null, platform: 'facebook' }; // Return object on error
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds to check connection status
  });

  // Check connection - account exists and has required fields
  const isFacebookConnected = !!(facebookAccount?.isConnected && facebookAccount?.pageId);
  
  // Debug logging
  useEffect(() => {
    console.log("🔍 Facebook Connection Status:", {
      facebookAccount,
      isConnected: facebookAccount?.isConnected,
      hasPageId: !!facebookAccount?.pageId,
      pageId: facebookAccount?.pageId,
      isFacebookConnected,
      isLoadingFacebook,
    });
  }, [facebookAccount, isFacebookConnected, isLoadingFacebook]);

  // State for ad generator with product from SmartShelf
  const [adGeneratorProduct, setAdGeneratorProduct] = useState<any>(null);
  const [autoOpenDialog, setAutoOpenDialog] = useState(false);
  const [autoOpenPlaybook, setAutoOpenPlaybook] = useState<"Flash Sale" | "New Arrival" | "Best Seller Spotlight" | "Bundle Up!" | undefined>(undefined);

  // Handle Facebook OAuth callback from Supabase
  useEffect(() => {
    const handleSupabaseCallback = async () => {
      try {
        const session = await getSession();
        const provider = session?.user?.app_metadata?.provider || 
          session?.user?.identities?.find((id: any) => id.provider)?.provider;
        
        console.log("🔐 Supabase Session:", {
          hasSession: !!session,
          provider: provider,
          hasProviderToken: !!session?.provider_token,
        });

        // Check if session has Facebook provider token
        const hasFacebookToken = session?.provider_token && 
          (session.user?.app_metadata?.provider === 'facebook' || 
           session.user?.identities?.some((id: any) => id.provider === 'facebook'));
        
        if (hasFacebookToken) {
          // We have a Facebook token from Supabase, now get pages and store
          try {
            const response = await socialMediaApi.connectFacebookFromSupabase({
              accessToken: session.provider_token,
              refreshToken: session.provider_refresh_token || undefined,
            });
            
            if (response.success) {
              toast.success("Facebook connected successfully!", {
                description: "You can now publish campaigns to Facebook",
              });
              refetchFacebook();
              queryClient.invalidateQueries({ queryKey: ["facebookAccount"] });
            } else {
              toast.error("Failed to connect Facebook", {
                description: response.message || "Please try again",
              });
            }
          } catch (err: any) {
            console.error("Error processing Supabase Facebook token:", err);
            toast.error("Failed to process Facebook connection", {
              description: err?.response?.data?.message || err?.message || "Please try again",
            });
          }
        }
      } catch (error: any) {
        console.error("Error checking Supabase session:", error);
      }
    };

    // Check URL params for callback
    const params = new URLSearchParams(window.location.search);
    const facebookConnected = params.get("facebook_connected");
    const error = params.get("error");

    if (facebookConnected === "true") {
      // Supabase redirected back, check for session
      handleSupabaseCallback();
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      toast.error("Facebook connection failed", {
        description: error === "no_pages" 
          ? "You need to have a Facebook Page to publish ads"
          : "Please try again or check your Facebook permissions",
      });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Listen to Supabase auth state changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      const provider = session?.user?.app_metadata?.provider || 
        session?.user?.identities?.find((id: any) => id.provider)?.provider;
      console.log("🔐 Supabase auth state changed:", event, provider);
      const isFacebookProvider = session?.user?.app_metadata?.provider === 'facebook' || 
        session?.user?.identities?.some((id: any) => id.provider === 'facebook');
      
      if (event === 'SIGNED_IN' && isFacebookProvider && session?.provider_token) {
        handleSupabaseCallback();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refetchFacebook, queryClient]);

  // Handle promotion data from SmartShelf navigation and event context from Forecast Calendar
  useEffect(() => {
    const state = location.state as { 
      promotion?: any; 
      product?: any; 
      playbook?: string;
      event?: {
        name: string;
        date: string;
        trendingKeywords: string[];
        expectedTraffic: "High" | "Normal" | "Low";
        demandIncrease?: number;
      };
    } | null;
    
    // Handle event context from Forecast Calendar
    if (state?.event) {
      console.log("🎯 Received event from Forecast Calendar:", {
        event: state.event,
        trendingKeywords: state.event.trendingKeywords,
      });
      
      // Use first trending keyword as product name, or event name
      const productName = state.event.trendingKeywords[0] || state.event.name;
      
      // Store product for ad generator with event context
      // Use the event name and first trending keyword for product name
      const eventProductName = state.event.trendingKeywords.length > 0
        ? `${state.event.trendingKeywords[0]} - ${state.event.name}`
        : `${state.event.name} Event Campaign`;
      
      setAdGeneratorProduct({
        id: `event-${state.event.name}`,
        name: eventProductName,
        imageUrl: undefined, // No product image for event-based campaigns
        shopId: shopId,
        eventContext: state.event, // Store full event context
      });
      
      // Auto-open the dialog with Flash Sale playbook for events
      setAutoOpenPlaybook("Flash Sale");
      setAutoOpenDialog(true);
      toast.success(`Opening campaign for ${state.event.name} event`, {
        description: `Trending: ${state.event.trendingKeywords.slice(0, 2).join(", ")}`
      });
      
      // Clear the state after processing
      window.history.replaceState({}, document.title);
      return;
    }
    
    // Handle product from SmartShelf
    if (state?.product) {
      console.log("🎯 Received product from SmartShelf:", {
        product: state.product,
        hasProductImage: !!state.product?.imageUrl,
        productId: state.product?.productId,
        playbook: state.playbook,
      });
      
      // Store product for ad generator
      setAdGeneratorProduct({
        id: state.product.productId || state.product.id,
        name: state.product.name,
        imageUrl: state.product?.imageUrl,
        shopId: state.product?.shopId,
      });
      
      // If playbook is provided, auto-open the dialog
      if (state.playbook) {
        setAutoOpenPlaybook(state.playbook as any);
        setAutoOpenDialog(true);
        toast.success(`Opening ${state.playbook} playbook for ${state.product.name}`);
      } else {
        toast.success("Product loaded! Generate your ad campaign.");
      }
      
      // Clear the state after processing
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleUsePromotion = async (promo: any) => {
    try {
      await createCampaignMutation.mutateAsync({
        name: `${promo.product_name} - ${promo.event_title}`,
        content: {
          promo_copy: promo.promo_copy,
          playbook: "Flash Sale",
          product_name: promo.product_name,
          discount: `${promo.suggested_discount_pct}% OFF`,
        },
        status: "DRAFT",
        platform: "SHOPEE",
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created from promotion!");
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Helper function to update scheduledDateTime from date and time components
  const updateScheduledDateTime = (date: string, hour: number, minute: number, amPm: "AM" | "PM") => {
    if (!date) return;
    
    // Convert 12-hour to 24-hour format
    let hour24 = hour;
    if (amPm === "PM" && hour !== 12) {
      hour24 = hour + 12;
    } else if (amPm === "AM" && hour === 12) {
      hour24 = 0;
    }
    
    // Create a date object in local timezone
    const localDate = new Date(`${date}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
    
    // Convert to ISO string (this will be in UTC, but represents the user's local time)
    // The backend will store this UTC time, and the scheduler will compare against UTC
    setScheduledDateTime(localDate.toISOString());
  };

  const handleSchedule = async (campaign: any, scheduledAt?: string) => {
    if (!scheduledAt) {
      // Check Facebook connection before scheduling
      if (!isFacebookConnected) {
        const shouldConnect = confirm(
          "Facebook is not connected. You need to connect your Facebook Page to schedule campaigns. Would you like to connect now?"
        );
        if (shouldConnect) {
          handleConnectFacebook();
        }
        return;
      }
      // Show date picker dialog
      setSchedulingCampaign(campaign);
      // Set default to 1 hour from now
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1);
      const hours = defaultDate.getHours();
      const minutes = defaultDate.getMinutes();
      
      // Convert to 12-hour format
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const amPm = hours >= 12 ? "PM" : "AM";
      
      setSelectedHour(hour12);
      setSelectedMinute(minutes);
      setSelectedAmPm(amPm);
      setSelectedDate(defaultDate.toISOString().slice(0, 10));
      
      // Also set the datetime string for compatibility
      updateScheduledDateTime(defaultDate.toISOString().slice(0, 10), hour12, minutes, amPm);
      return;
    }

    try {
      const result = await scheduleCampaignMutation.mutateAsync({
        id: campaign.id,
        scheduledAt,
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setSchedulingCampaign(null);
      setScheduledDateTime("");
      setSelectedDate("");
      setSelectedHour(1);
      setSelectedMinute(0);
      setSelectedAmPm("PM");
      
      // Show Facebook scheduling result
      if (result?.warning) {
        toast.warning("Campaign scheduled", {
          description: result.warning,
        });
      } else if ((result?.data as any)?.facebookPostId) {
        toast.success("Campaign scheduled to Facebook!", {
          description: `Post ID: ${(result.data as any).facebookPostId}`,
        });
      }
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handlePublish = async (campaign: any) => {
    // Check Facebook connection before publishing
    if (!isFacebookConnected) {
      const shouldConnect = confirm(
        "Facebook is not connected. You need to connect your Facebook Page to publish campaigns. Would you like to connect now?"
      );
      if (shouldConnect) {
        handleConnectFacebook();
      }
      return;
    }

    try {
      const result = await publishCampaignMutation.mutateAsync(campaign.id);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      
      // Show Facebook publishing result
      if (result?.warning) {
        toast.warning("Campaign published", {
          description: result.warning,
          duration: 8000,
        });
      } else if ((result?.data as any)?.facebookPostId) {
        toast.success("Campaign published to Facebook!", {
          description: `Post ID: ${(result.data as any).facebookPostId}`,
          duration: 5000,
        });
      } else if ((result?.data as any)?.facebookError) {
        toast.error("Campaign published but Facebook failed", {
          description: (result.data as any).facebookError,
          duration: 10000,
        });
      } else {
        toast.success("Campaign published successfully!");
      }
    } catch (error: any) {
      // Show detailed error
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to publish campaign";
      toast.error("Failed to publish campaign", {
        description: errorMessage,
        duration: 8000,
      });
      console.error("Publish error:", error);
    }
  };

  const handleConnectFacebook = async () => {
    try {
      setIsConnectingFacebook(true);
      // Use Supabase OAuth for Facebook connection
      const redirectTo = `${window.location.origin}/ads?facebook_connected=true`;
      await signInWithFacebook(redirectTo);
      // Note: signInWithFacebook redirects the user, so setIsConnectingFacebook(false) won't be reached
    } catch (error: any) {
      console.error("Facebook OAuth error:", error);
      toast.error("Failed to connect Facebook", {
        description: error?.message || "Please try again",
      });
      setIsConnectingFacebook(false);
    }
  };

  const handleCancel = async (campaign: any) => {
    if (!confirm("Are you sure you want to cancel the scheduling? The campaign will be moved to drafts.")) return;

    try {
      await unscheduleCampaignMutation.mutateAsync(campaign.id);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      refetchCampaigns();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">🎯 MarketMate</h1>
            <p className="text-muted-foreground">AI-powered marketing automation for your products</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Facebook Connection Status */}
            <div className="flex items-center gap-2">
              {isFacebookConnected ? (
                <>
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700 gap-2">
                    <CheckCircle2 className="h-3 w-3" />
                    Facebook Connected
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectFacebook}
                    disabled={isConnectingFacebook}
                    className="gap-2"
                    title="Reconnect Facebook"
                  >
                    {isConnectingFacebook ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Reconnecting...
                      </>
                    ) : (
                      <>
                        <Facebook className="h-4 w-4" />
                        Reconnect
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectFacebook}
                    disabled={isConnectingFacebook}
                    className="gap-2"
                  >
                    {isConnectingFacebook ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Facebook className="h-4 w-4" />
                        Connect Facebook
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      refetchFacebook();
                      queryClient.invalidateQueries({ queryKey: ["facebookAccount"] });
                      toast.info("Refreshing Facebook connection status...");
                    }}
                    className="gap-2"
                    title="Refresh connection status"
                  >
                    <Loader2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <AdGeneratorDialog 
            open={autoOpenDialog}
            onOpenChange={(open) => {
              setAutoOpenDialog(open);
              if (!open) {
                setAutoOpenPlaybook(undefined);
                setAdGeneratorProduct(null);
              }
            }}
            initialProductName={adGeneratorProduct?.name || location.state?.product?.name}
            initialProductId={adGeneratorProduct?.id || location.state?.product?.productId}
            initialProductImageUrl={adGeneratorProduct?.imageUrl || location.state?.product?.imageUrl}
            initialShopId={adGeneratorProduct?.shopId || location.state?.product?.shopId}
            initialPlaybook={autoOpenPlaybook || location.state?.playbook as any}
          />
          </div>
        </div>
      </div>

      {/* Product Preview from SmartShelf */}
      {location.state?.product && (
        <Card className="glass-card border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Package className="h-5 w-5 text-primary" />
              Selected Product from SmartShelf
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {location.state.product.imageUrl && (
                <img 
                  src={location.state.product.imageUrl} 
                  alt={location.state.product.name}
                  className="w-20 h-20 object-cover rounded-lg border border-border"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{location.state.product.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ready to generate AI-powered ads for this product. Click "Generate New Ad" above to get started!
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.history.replaceState({}, document.title)}
                className="text-muted-foreground"
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* AI Smart Promotions */}
      {promotionsLoading ? (
        <Card className="glass-card">
          <CardContent className="py-12 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading promotions...</p>
            </div>
          </CardContent>
        </Card>
      ) : hasPromotions ? (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              🎯 AI Smart Promotions (Near-Expiry Items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {promotionsData.promotions.map((promo, index) => (
                <div key={index} className="p-4 glass-card-sm hover:shadow-glow transition-smooth">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{promo.product_name}</h3>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                          {promo.suggested_discount_pct}% OFF
                        </Badge>
                        <Badge variant="secondary">{promo.event_title}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {promo.start_date} - {promo.end_date}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 p-3 glass-card-sm text-sm">
                    {promo.promo_copy}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Expected Sales Lift: <strong className="text-success">+{promo.projected_sales_lift}%</strong></span>
                      <span>•</span>
                      <span>Clear in: <strong className="text-foreground">{promo.expected_clear_days} days</strong></span>
                      <span>•</span>
                      <span>Confidence: <strong className="text-foreground">{promo.confidence}</strong></span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="glass-card-sm"
                        onClick={() => setPreviewPromo(promo)}
                      >
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => handleUsePromotion(promo)}
                        disabled={createCampaignMutation.isPending}
                      >
                        {createCampaignMutation.isPending ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          "Use This"
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground italic">
                    💡 {promo.reasoning}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Campaign Playbooks */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Lightbulb className="h-5 w-5 text-primary" />
            ✨ AI Campaign Playbooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <AdGeneratorDialog 
              initialPlaybook="Flash Sale"
              initialProductName={location.state?.product?.name}
              initialProductId={location.state?.product?.productId}
              initialProductImageUrl={location.state?.product?.imageUrl}
              trigger={
                <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
                  <Megaphone className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-semibold mb-1 text-foreground">Flash Sale</div>
                  <div className="text-xs text-muted-foreground text-left">Create urgency with limited-time offers</div>
                </Button>
              }
            />
            <AdGeneratorDialog 
              initialPlaybook="New Arrival"
              initialProductName={location.state?.product?.name}
              initialProductId={location.state?.product?.productId}
              initialProductImageUrl={location.state?.product?.imageUrl}
              trigger={
                <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
                  <Calendar className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-semibold mb-1 text-foreground">New Arrival</div>
                  <div className="text-xs text-muted-foreground text-left">Launch new products with excitement</div>
                </Button>
              }
            />
            <AdGeneratorDialog 
              initialPlaybook="Best Seller Spotlight"
              initialProductName={location.state?.product?.name}
              initialProductId={location.state?.product?.productId}
              initialProductImageUrl={location.state?.product?.imageUrl}
              trigger={
                <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
                  <TrendingUp className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-semibold mb-1 text-foreground">Best Seller</div>
                  <div className="text-xs text-muted-foreground text-left">Highlight popular products</div>
                </Button>
              }
            />
            <AdGeneratorDialog 
              initialPlaybook="Bundle Up!"
              initialProductName={location.state?.product?.name}
              initialProductId={location.state?.product?.productId}
              initialProductImageUrl={location.state?.product?.imageUrl}
              initialShopId={location.state?.product?.shopId || shopId}
              trigger={
                <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
                  <Eye className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-semibold mb-1 text-foreground">Bundle Up!</div>
                  <div className="text-xs text-muted-foreground text-left">Create compelling bundle offers</div>
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      {campaignsLoading ? (
        <Card className="glass-card">
          <CardContent className="py-12 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading campaigns...</p>
            </div>
          </CardContent>
        </Card>
      ) : !hasCampaigns ? (
        <Card className="glass-card">
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <PackageOpen className="h-16 w-16 text-muted-foreground/50" />
              <div>
                <h3 className="font-semibold text-lg text-foreground mb-2">No Campaigns Yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-4">
                  Start creating AI-powered marketing campaigns using our Campaign Playbooks above. 
                  Generate compelling ad copy instantly!
                </p>
                <AdGeneratorDialog 
                  initialProductName={location.state?.product?.name}
                  initialProductId={location.state?.product?.productId}
                  initialProductImageUrl={location.state?.product?.imageUrl}
                  initialShopId={location.state?.product?.shopId || shopId}
                  trigger={
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-nav-active">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Your First Campaign
                    </Button>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-foreground">📋 Your Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.map((campaign: any) => (
                <div key={campaign.id} className="p-4 glass-card-sm hover:shadow-glow transition-smooth">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{campaign.title}</h3>
                        <Badge variant={getStatusColor(campaign.status)} className={campaign.status === 'published' ? 'bg-green-600' : ''}>
                          {campaign.status}
                        </Badge>
                        <Badge variant="outline" className={getPlatformColor(campaign.platform)}>
                          {campaign.platform}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{campaign.type}</p>
                    </div>
                  </div>

                  {/* Campaign Image - Hidden in list view, only shown in View dialog */}
                  {/* Images are visible when clicking the "View" button */}
                  
                  {/* Campaign Caption/Ad Copy Preview */}
                  <div className="mb-3 p-3 glass-card-sm text-sm">
                    <p className="text-foreground">{campaign.caption || "No ad copy available"}</p>
                    {(campaign.imageUrl || campaign.content?.image_url) && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Image available - Click "View" to see
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {campaign.status === "scheduled" && campaign.scheduledDate && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <Clock className="h-3 w-3" />
                          Scheduled: {campaign.scheduledDate}
                        </span>
                      )}
                      {campaign.status !== "scheduled" && campaign.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {campaign.scheduledDate}
                        </span>
                      )}
                      {campaign.status === "published" && campaign.engagement && (
                        <>
                          <span>Views: <strong className="text-foreground">{campaign.engagement.views.toLocaleString()}</strong></span>
                          <span>Clicks: <strong className="text-foreground">{campaign.engagement.clicks.toLocaleString()}</strong></span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {/* View Button - Available for all campaign statuses */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="glass-card-sm"
                        onClick={() => setViewingCampaign(campaign)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      {campaign.status === "draft" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="glass-card-sm"
                            onClick={() => setEditingCampaign(campaign)}
                          >
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-nav-active"
                            onClick={() => handleSchedule(campaign)}
                            disabled={scheduleCampaignMutation.isPending || isLoadingFacebook || !isFacebookConnected}
                            title={!isFacebookConnected ? "Connect Facebook to schedule" : ""}
                          >
                            {scheduleCampaignMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Scheduling...
                              </>
                            ) : (
                              "Schedule"
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => handlePublish(campaign)}
                            disabled={publishCampaignMutation.isPending || isLoadingFacebook || !isFacebookConnected}
                            title={!isFacebookConnected ? "Connect Facebook to publish" : ""}
                          >
                            {publishCampaignMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Publishing...
                              </>
                            ) : (
                              "Publish Now"
                            )}
                          </Button>
                        </>
                      )}
                      {campaign.status === "scheduled" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="glass-card-sm"
                            onClick={() => handleSchedule(campaign)}
                            disabled={scheduleCampaignMutation.isPending || isLoadingFacebook || !isFacebookConnected}
                            title={!isFacebookConnected ? "Connect Facebook to reschedule" : ""}
                          >
                            Reschedule
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancel(campaign)}
                            disabled={unscheduleCampaignMutation.isPending}
                          >
                            {unscheduleCampaignMutation.isPending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Canceling...
                              </>
                            ) : (
                              "Cancel"
                            )}
                          </Button>
                        </>
                      )}
                      {campaign.status === "published" && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="glass-card-sm"
                          onClick={() => {
                            toast.info("Analytics feature coming soon!");
                          }}
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          View Analytics
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Promotion Dialog */}
      <Dialog open={!!previewPromo} onOpenChange={(open) => !open && setPreviewPromo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewPromo?.product_name}</DialogTitle>
            <DialogDescription>Promotion Preview</DialogDescription>
          </DialogHeader>
          {previewPromo && (
            <div className="space-y-4">
              <div className="p-4 glass-card-sm">
                <p className="text-sm">{previewPromo.promo_copy}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Discount:</span>{" "}
                  <strong>{previewPromo.suggested_discount_pct}% OFF</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Period:</span>{" "}
                  <strong>{previewPromo.start_date} - {previewPromo.end_date}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected Sales Lift:</span>{" "}
                  <strong className="text-success">+{previewPromo.projected_sales_lift}%</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Clear in:</span>{" "}
                  <strong>{previewPromo.expected_clear_days} days</strong>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewPromo(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  handleUsePromotion(previewPromo);
                  setPreviewPromo(null);
                }}>
                  Use This Promotion
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Campaign Dialog */}
      <Dialog open={!!schedulingCampaign} onOpenChange={(open) => {
        if (!open) {
          setSchedulingCampaign(null);
          setScheduledDateTime("");
          setSelectedDate("");
          setSelectedHour(1);
          setSelectedMinute(0);
          setSelectedAmPm("PM");
        }
      }}>
        <DialogContent className="glass-card sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Schedule Campaign
            </DialogTitle>
            <DialogDescription>
              {schedulingCampaign && (
                <span className="text-muted-foreground">
                  Choose when to publish "{schedulingCampaign.title || schedulingCampaign.name || 'this campaign'}" to Facebook
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {schedulingCampaign && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Select Date
                </Label>
                <Input
                  type="date"
                  className="glass-card-sm border-card-glass-border text-foreground"
                  min={new Date().toISOString().slice(0, 10)}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    updateScheduledDateTime(e.target.value, selectedHour, selectedMinute, selectedAmPm);
                  }}
                  disabled={scheduleCampaignMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Select Time
                </Label>
                <div className="flex items-center gap-4 justify-center">
                  {/* Hour Picker */}
                  <div className="flex flex-col items-center">
                    <Label className="text-xs text-muted-foreground mb-2">Hour</Label>
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-12 rounded-t-lg"
                        onClick={() => {
                          const newHour = selectedHour === 12 ? 1 : selectedHour + 1;
                          setSelectedHour(newHour);
                          updateScheduledDateTime(selectedDate, newHour, selectedMinute, selectedAmPm);
                        }}
                        disabled={scheduleCampaignMutation.isPending || !selectedDate}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <div className="h-12 w-16 flex items-center justify-center glass-card-sm border-card-glass-border rounded text-lg font-semibold text-foreground">
                        {selectedHour}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-12 rounded-b-lg"
                        onClick={() => {
                          const newHour = selectedHour === 1 ? 12 : selectedHour - 1;
                          setSelectedHour(newHour);
                          updateScheduledDateTime(selectedDate, newHour, selectedMinute, selectedAmPm);
                        }}
                        disabled={scheduleCampaignMutation.isPending || !selectedDate}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <span className="text-2xl font-bold text-foreground mt-6">:</span>

                  {/* Minute Picker */}
                  <div className="flex flex-col items-center">
                    <Label className="text-xs text-muted-foreground mb-2">Minute</Label>
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-12 rounded-t-lg"
                        onClick={() => {
                          const newMinute = selectedMinute === 59 ? 0 : selectedMinute + 1;
                          setSelectedMinute(newMinute);
                          updateScheduledDateTime(selectedDate, selectedHour, newMinute, selectedAmPm);
                        }}
                        disabled={scheduleCampaignMutation.isPending || !selectedDate}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <div className="h-12 w-16 flex items-center justify-center glass-card-sm border-card-glass-border rounded text-lg font-semibold text-foreground">
                        {String(selectedMinute).padStart(2, '0')}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-12 rounded-b-lg"
                        onClick={() => {
                          const newMinute = selectedMinute === 0 ? 59 : selectedMinute - 1;
                          setSelectedMinute(newMinute);
                          updateScheduledDateTime(selectedDate, selectedHour, newMinute, selectedAmPm);
                        }}
                        disabled={scheduleCampaignMutation.isPending || !selectedDate}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* AM/PM Picker */}
                  <div className="flex flex-col items-center">
                    <Label className="text-xs text-muted-foreground mb-2">Period</Label>
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-12 rounded-t-lg"
                        onClick={() => {
                          const newAmPm = selectedAmPm === "AM" ? "PM" : "AM";
                          setSelectedAmPm(newAmPm);
                          updateScheduledDateTime(selectedDate, selectedHour, selectedMinute, newAmPm);
                        }}
                        disabled={scheduleCampaignMutation.isPending || !selectedDate}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <div className="h-12 w-16 flex items-center justify-center glass-card-sm border-card-glass-border rounded text-lg font-semibold text-foreground">
                        {selectedAmPm}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-12 rounded-b-lg"
                        onClick={() => {
                          const newAmPm = selectedAmPm === "AM" ? "PM" : "AM";
                          setSelectedAmPm(newAmPm);
                          updateScheduledDateTime(selectedDate, selectedHour, selectedMinute, newAmPm);
                        }}
                        disabled={scheduleCampaignMutation.isPending || !selectedDate}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  The campaign will be automatically published to your Facebook Page at the selected time.
                </p>
              </div>

              {scheduledDateTime && (
                <div className="p-3 glass-card-sm border-card-glass-border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Scheduled for:</p>
                  <p className="text-base font-semibold text-foreground">
                    {new Date(scheduledDateTime).toLocaleString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSchedulingCampaign(null);
                setScheduledDateTime("");
                setSelectedDate("");
                setSelectedHour(1);
                setSelectedMinute(0);
                setSelectedAmPm("PM");
              }}
              disabled={scheduleCampaignMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (scheduledDateTime) {
                  handleSchedule(schedulingCampaign, new Date(scheduledDateTime).toISOString());
                } else {
                  toast.error("Please select a date and time");
                }
              }}
              disabled={!scheduledDateTime || scheduleCampaignMutation.isPending || !isFacebookConnected}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {scheduleCampaignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Scheduling...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Campaign Dialog */}
      <Dialog open={!!viewingCampaign} onOpenChange={(open) => !open && setViewingCampaign(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              View Campaign
            </DialogTitle>
            <DialogDescription>
              View full campaign details including generated ad copy and image
            </DialogDescription>
          </DialogHeader>
          {viewingCampaign && (() => {
            // Get the latest campaign data from the campaigns list to ensure we have fresh data
            const latestCampaign = campaigns.find((c: any) => c.id === viewingCampaign.id) || viewingCampaign;
            
            // Get caption from all possible sources
            const displayCaption = latestCampaign.caption 
              || latestCampaign.content?.ad_copy 
              || latestCampaign.content?.promo_copy 
              || "";
            
            // Get the image URL from either source - prioritize database imageUrl
            const displayImageUrl = latestCampaign.imageUrl || latestCampaign.content?.image_url || null;
            
            // Debug: Log campaign data when viewing
            console.log("Viewing campaign:", {
              id: latestCampaign.id,
              title: latestCampaign.title,
              hasCaption: !!latestCampaign.caption,
              hasAdCopy: !!latestCampaign.content?.ad_copy,
              hasPromoCopy: !!latestCampaign.content?.promo_copy,
              displayCaptionLength: displayCaption.length,
              displayCaptionPreview: displayCaption.substring(0, 50),
              hasImageUrl: !!latestCampaign.imageUrl,
              hasContentImageUrl: !!latestCampaign.content?.image_url,
              imageUrl: latestCampaign.imageUrl?.substring(0, 50),
              contentImageUrl: latestCampaign.content?.image_url?.substring(0, 50),
            });
            
            return (
            <div className="space-y-6 py-4">
              {/* Campaign Header */}
              <div className="flex items-start justify-between pb-4 border-b">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">{viewingCampaign.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(viewingCampaign.status)} className={viewingCampaign.status === 'published' ? 'bg-green-600' : ''}>
                      {viewingCampaign.status}
                    </Badge>
                    <Badge variant="outline" className={getPlatformColor(viewingCampaign.platform)}>
                      {viewingCampaign.platform}
                    </Badge>
                    <Badge variant="secondary">{viewingCampaign.type}</Badge>
                    {viewingCampaign.status === "scheduled" && viewingCampaign.scheduledDate && (
                      <span className="text-xs text-primary font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Scheduled: {viewingCampaign.scheduledDate}
                      </span>
                    )}
                    {viewingCampaign.status !== "scheduled" && viewingCampaign.scheduledDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {viewingCampaign.scheduledDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Campaign Image - Full View */}
              {displayImageUrl ? (
                <Card className="glass-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Generated Ad Image
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          try {
                            const link = document.createElement('a');
                            link.href = displayImageUrl;
                            link.download = `campaign-${latestCampaign.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            toast.success("Image downloaded successfully!");
                          } catch (error) {
                            toast.error("Failed to download image");
                          }
                        }}
                        className="gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Image
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full rounded-lg overflow-hidden border border-card-glass-border bg-muted">
                      <img 
                        src={displayImageUrl} 
                        alt={latestCampaign.title}
                        className="w-full h-auto max-h-[600px] object-contain mx-auto"
                        onError={(e) => {
                          console.error("Failed to load campaign image:", {
                            imageUrl: displayImageUrl?.substring(0, 100),
                            campaignId: latestCampaign.id,
                            hasImageUrl: !!latestCampaign.imageUrl,
                            hasContentImageUrl: !!latestCampaign.content?.image_url
                          });
                          toast.error("Failed to load campaign image");
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      Generated Ad Image
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-8 text-center text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mx-auto mb-2 opacity-50" />
                      <p>No image generated for this campaign</p>
                      <p className="text-xs mt-2">Generate an image when creating or editing this campaign</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ad Copy - Full View */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Generated Ad Copy
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Get caption from all possible sources
                        const captionText = latestCampaign.caption 
                          || latestCampaign.content?.ad_copy 
                          || latestCampaign.content?.promo_copy
                          || "";
                        
                        if (captionText) {
                          navigator.clipboard.writeText(captionText);
                          toast.success("Ad copy copied to clipboard!");
                        } else {
                          toast.error("No ad copy available to copy");
                        }
                      }}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Text
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 glass-card-sm rounded-lg">
                    {displayCaption ? (
                      <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                        {displayCaption}
                      </p>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No ad copy available</p>
                        <p className="text-xs mt-2">Generate ad copy when creating or editing this campaign</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Details */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Campaign Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Product:</span>
                      <p className="font-semibold text-foreground">{latestCampaign.content?.product_name || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Playbook:</span>
                      <p className="font-semibold text-foreground">{latestCampaign.type || "N/A"}</p>
                    </div>
                    {latestCampaign.content?.discount && (
                      <div>
                        <span className="text-muted-foreground">Discount:</span>
                        <p className="font-semibold text-success">{latestCampaign.content.discount}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <p className="font-semibold text-foreground">
                        {latestCampaign.createdAt 
                          ? new Date(latestCampaign.createdAt).toLocaleDateString()
                          : latestCampaign.content?.createdAt 
                          ? new Date(latestCampaign.content.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    {latestCampaign.status === "published" && latestCampaign.engagement && (
                      <>
                        <div>
                          <span className="text-muted-foreground">Views:</span>
                          <p className="font-semibold text-foreground">{latestCampaign.engagement.views?.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Clicks:</span>
                          <p className="font-semibold text-foreground">{latestCampaign.engagement.clicks?.toLocaleString() || "0"}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewingCampaign(null)}>
                  Close
                </Button>
                {latestCampaign.status === "draft" && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setViewingCampaign(null);
                      setEditingCampaign(latestCampaign);
                    }}
                  >
                    Edit Campaign
                  </Button>
                )}
              </div>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      {editingCampaign && (
        <AdGeneratorDialog
          open={!!editingCampaign}
          onOpenChange={(open) => {
            // Only close if not generating and user explicitly closes
            if (!open) {
              setEditingCampaign(null);
            }
          }}
          editingCampaignId={editingCampaign.id}
          initialProductName={editingCampaign.content?.product_name || editingCampaign.title || ""}
          initialPlaybook={editingCampaign.type || editingCampaign.content?.playbook || "Flash Sale"}
          initialProductImageUrl={editingCampaign.content?.product_image_url || editingCampaign.imageUrl || editingCampaign.content?.image_url}
          initialGeneratedImageUrl={editingCampaign.imageUrl || editingCampaign.content?.image_url} // Current generated ad image
          initialGeneratedAdCopy={editingCampaign.caption || editingCampaign.content?.ad_copy || editingCampaign.content?.promo_copy} // Current generated ad copy
          initialShopId={shopId}
          onAdGenerated={(adData) => {
            // Show notification
            toast.success("Campaign Updated!", {
              description: `Campaign for ${adData.productName} has been updated`,
              duration: 5000,
            });
            // Refresh campaigns but DON'T close dialog - keep it open for further editing
            refetchCampaigns();
            // Don't setEditingCampaign(null) - keep modal open
          }}
        />
      )}
    </div>
  );
}
