import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Sparkles, Calendar, Eye, TrendingUp, Loader2, Lightbulb, PackageOpen } from "lucide-react";
import { AdGeneratorDialog } from "@/components/AdGeneratorDialog";
import { usePromotions, useCampaigns } from "@/hooks/useMarketMate";
import { useAuth } from "@/contexts/AuthContext";

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
  const shopId = user?.shops?.[0]?.id || "";
  const { data: promotionsData, isLoading: promotionsLoading } = usePromotions(shopId, !!shopId);
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns(shopId, !!shopId);

  const campaigns = campaignsData?.data || [];
  const hasCampaigns = campaigns && campaigns.length > 0;
  const hasPromotions = promotionsData && promotionsData.data.promotions.length > 0;

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
              {promotionsData.data.promotions.map((promo, index) => (
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
                      <Button variant="outline" size="sm" className="glass-card-sm">Preview</Button>
                      <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">Use This</Button>
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
              trigger={
                <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
                  <Megaphone className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-semibold mb-1 text-foreground">Flash Sale</div>
                  <div className="text-xs text-muted-foreground text-left">Create urgency with limited-time offers</div>
                </Button>
              }
            />
            <AdGeneratorDialog 
              trigger={
                <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
                  <Calendar className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-semibold mb-1 text-foreground">New Arrival</div>
                  <div className="text-xs text-muted-foreground text-left">Launch new products with excitement</div>
                </Button>
              }
            />
            <AdGeneratorDialog 
              trigger={
                <Button variant="outline" className="h-auto flex-col items-start p-4 glass-card-sm hover:shadow-glow">
                  <TrendingUp className="h-5 w-5 mb-2 text-primary" />
                  <div className="font-semibold mb-1 text-foreground">Best Seller</div>
                  <div className="text-xs text-muted-foreground text-left">Highlight popular products</div>
                </Button>
              }
            />
            <AdGeneratorDialog 
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

                  <div className="mb-3 p-3 glass-card-sm text-sm">
                    {campaign.caption}
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
                      {campaign.status === "draft" && (
                        <>
                          <Button variant="outline" size="sm" className="glass-card-sm">Edit</Button>
                          <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-nav-active">Schedule</Button>
                        </>
                      )}
                      {campaign.status === "scheduled" && (
                        <>
                          <Button variant="outline" size="sm" className="glass-card-sm">Reschedule</Button>
                          <Button variant="destructive" size="sm">Cancel</Button>
                        </>
                      )}
                      {campaign.status === "published" && (
                        <Button variant="outline" size="sm" className="glass-card-sm">View Analytics</Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
