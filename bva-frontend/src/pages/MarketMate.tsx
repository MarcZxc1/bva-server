import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Megaphone, Sparkles, Calendar, Eye, TrendingUp, Loader2, Lightbulb, PackageOpen, BarChart3, Download, Image as ImageIcon, Copy } from "lucide-react";
import { AdGeneratorDialog } from "@/components/AdGeneratorDialog";
import { usePromotions, useCampaigns, useCreateCampaign, useScheduleCampaign, usePublishCampaign, useDeleteCampaign } from "@/hooks/useMarketMate";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const deleteCampaignMutation = useDeleteCampaign();
  const queryClient = useQueryClient();

  const [previewPromo, setPreviewPromo] = useState<any>(null);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [schedulingCampaign, setSchedulingCampaign] = useState<any>(null);
  const [viewingCampaign, setViewingCampaign] = useState<any>(null);

  const campaigns = campaignsData || [];
  const hasCampaigns = campaigns && campaigns.length > 0;
  const hasPromotions = promotionsData && promotionsData.promotions.length > 0;

  // Handle promotion data from SmartShelf navigation
  useEffect(() => {
    const state = location.state as { promotion?: any; product?: any } | null;
    if (state?.promotion) {
      console.log("🎯 Received promotion from SmartShelf:", state.promotion);
      // Auto-create campaign from the promotion
      const createCampaignFromPromotion = async () => {
        try {
          await createCampaignMutation.mutateAsync({
            name: `${state.promotion.product_name} - ${state.promotion.event_title}`,
            content: {
              promo_copy: state.promotion.promo_copy,
              playbook: "Flash Sale",
              product_name: state.promotion.product_name,
              discount: `${state.promotion.suggested_discount_pct}% OFF`,
            },
            status: "DRAFT",
            platform: "SHOPEE",
          });
          queryClient.invalidateQueries({ queryKey: ["campaigns"] });
          // Clear the state after processing
          window.history.replaceState({}, document.title);
          toast.success("Campaign created from SmartShelf promotion!");
        } catch (error) {
          console.error("Error creating campaign from promotion:", error);
          // Clear state even on error to prevent re-processing
          window.history.replaceState({}, document.title);
        }
      };
      createCampaignFromPromotion();
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

  const handleSchedule = async (campaign: any, scheduledAt?: string) => {
    if (!scheduledAt) {
      // Show date picker dialog
      setSchedulingCampaign(campaign);
      return;
    }

    try {
      await scheduleCampaignMutation.mutateAsync({
        id: campaign.id,
        scheduledAt,
      });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setSchedulingCampaign(null);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handlePublish = async (campaign: any) => {
    try {
      await publishCampaignMutation.mutateAsync(campaign.id);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleCancel = async (campaign: any) => {
    if (!confirm("Are you sure you want to cancel this campaign?")) return;

    try {
      await deleteCampaignMutation.mutateAsync(campaign.id);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
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
          <AdGeneratorDialog />
        </div>
      </div>

      {/* Summary Cards - Only show if there are campaigns */}
      {!campaignsLoading && hasCampaigns && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{campaigns.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Generated campaigns</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">--</div>
              <p className="text-xs text-muted-foreground mt-1">
                Publish campaigns to track
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">--</div>
              <p className="text-xs text-muted-foreground mt-1">
                Publish campaigns to track
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">0</div>
              <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
            </CardContent>
          </Card>
        </div>
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
                      {campaign.scheduledDate && (
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
                            disabled={scheduleCampaignMutation.isPending}
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
                            disabled={publishCampaignMutation.isPending}
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
                            disabled={scheduleCampaignMutation.isPending}
                          >
                            Reschedule
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancel(campaign)}
                            disabled={deleteCampaignMutation.isPending}
                          >
                            {deleteCampaignMutation.isPending ? (
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
      <Dialog open={!!schedulingCampaign} onOpenChange={(open) => !open && setSchedulingCampaign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>Choose when to publish this campaign</DialogDescription>
          </DialogHeader>
          {schedulingCampaign && (
            <div className="space-y-4">
              <input
                type="datetime-local"
                className="w-full p-2 glass-card-sm border-card-glass-border rounded"
                min={new Date().toISOString().slice(0, 16)}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSchedule(schedulingCampaign, new Date(e.target.value).toISOString());
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSchedulingCampaign(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
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
            
            // Debug: Log campaign data when viewing
            console.log("Viewing campaign:", {
              id: latestCampaign.id,
              title: latestCampaign.title,
              hasImageUrl: !!latestCampaign.imageUrl,
              hasContentImageUrl: !!latestCampaign.content?.image_url,
              imageUrl: latestCampaign.imageUrl?.substring(0, 50),
              contentImageUrl: latestCampaign.content?.image_url?.substring(0, 50),
            });
            
            // Get the image URL from either source - prioritize database imageUrl
            const displayImageUrl = latestCampaign.imageUrl || latestCampaign.content?.image_url || null;
            
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
                    {viewingCampaign.scheduledDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled: {viewingCampaign.scheduledDate}
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
                        if (latestCampaign.caption) {
                          navigator.clipboard.writeText(latestCampaign.caption);
                          toast.success("Ad copy copied to clipboard!");
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
                    <p className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                      {latestCampaign.caption || latestCampaign.content?.ad_copy || latestCampaign.content?.promo_copy || "No ad copy available"}
                    </p>
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
                        {latestCampaign.content?.createdAt 
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
          onOpenChange={(open) => !open && setEditingCampaign(null)}
          initialProductName={editingCampaign.content?.product_name || ""}
          initialPlaybook={editingCampaign.type || "Flash Sale"}
          onAdGenerated={() => {
            setEditingCampaign(null);
            refetchCampaigns();
          }}
        />
      )}
    </div>
  );
}
