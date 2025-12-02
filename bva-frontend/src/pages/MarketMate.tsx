import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Sparkles, Calendar, Eye, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGenerateAd } from "@/hooks/useMarketMate";
import { Loader2 } from "lucide-react";

const adCampaigns = [
  {
    id: 1,
    title: "Flash Sale - Wireless Earbuds",
    type: "Limited Offer",
    platform: "Shopee",
    status: "scheduled",
    scheduledDate: "2025-11-01 10:00 AM",
    caption: "🎧 FLASH SALE ALERT! Premium Wireless Earbuds Pro now 40% OFF! Crystal clear sound, 24hr battery life. Limited stocks - grab yours now! #ShopeeFinds #TechDeals #WirelessEarbuds",
    engagement: { views: 0, clicks: 0 }
  },
  {
    id: 2,
    title: "Payday Sale - Smart Watch",
    type: "Payday Promo",
    platform: "Lazada",
    status: "published",
    scheduledDate: "2025-10-28 09:00 AM",
    caption: "💰 PAYDAY TREAT! Smart Watch Series 5 - Track your fitness goals in style. FREE shipping + extra 15% off this payday weekend! Limited time only! #PaydaySale #SmartWatch #FitnessGoals",
    engagement: { views: 2450, clicks: 342 }
  },
  {
    id: 3,
    title: "Trending Product - Phone Accessories",
    type: "Viral Content",
    platform: "TikTok",
    status: "draft",
    scheduledDate: null,
    caption: "📱 Must-have phone accessories that went viral! Premium cases + screen protectors + fast charging cables. Bundle deal - Save 50%! Tag a friend who needs this! #TikTokMadeMeBuyIt #PhoneAccessories #ViralProducts",
    engagement: { views: 0, clicks: 0 }
  },
  {
    id: 4,
    title: "New Arrival - Power Banks",
    type: "Product Launch",
    platform: "Shopee",
    status: "published",
    scheduledDate: "2025-10-27 02:00 PM",
    caption: "🔋 NEW ARRIVAL! 20000mAh Power Bank - Never run out of battery again! Fast charging, compact design, perfect for travel. Limited launch promo - 30% OFF first 100 orders! #NewArrival #PowerBank #TravelEssentials",
    engagement: { views: 1890, clicks: 267 }
  },
];

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
      return "bg-orange-500/10 text-orange-700 border-orange-200";
    case "Lazada":
      return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "TikTok":
      return "bg-pink-500/10 text-pink-700 border-pink-200";
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-200";
  }
};

export default function MarketMate() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [playbook, setPlaybook] = useState<"Flash Sale" | "New Arrival" | "Best Seller" | "Bundle">("Flash Sale");
  const [discount, setDiscount] = useState("");
  
  const generateAdMutation = useGenerateAd();

  const handleGenerateAd = async () => {
    if (!productName) {
      return;
    }

    generateAdMutation.mutate({
      product_name: productName,
      playbook,
      discount: discount || undefined,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setProductName("");
        setDiscount("");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">MarketMate</h1>
          <p className="text-muted-foreground">AI-powered marketing automation for your products</p>
        </div>
        <Button 
          className="gap-2 gradient-primary text-white border-0"
          onClick={() => setIsDialogOpen(true)}
        >
          <Sparkles className="h-4 w-4" />
          Generate New Campaign
        </Button>
      </div>

      {/* Generate Ad Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate AI-Powered Ad</DialogTitle>
            <DialogDescription>
              Create a professional marketing campaign using AI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                placeholder="e.g., iPhone 15 Pro"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playbook">Campaign Playbook *</Label>
              <Select value={playbook} onValueChange={(value: any) => setPlaybook(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flash Sale">Flash Sale</SelectItem>
                  <SelectItem value="New Arrival">New Arrival</SelectItem>
                  <SelectItem value="Best Seller">Best Seller</SelectItem>
                  <SelectItem value="Bundle">Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount/Promotion (Optional)</Label>
              <Input
                id="discount"
                placeholder="e.g., 50% OFF"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateAd}
              disabled={!productName || generateAdMutation.isPending}
            >
              {generateAdMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Ad
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground mt-1">Active across platforms</p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Reach</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2K</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +32% this week
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14.8%</div>
            <p className="text-xs text-success flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              Above average
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Playbooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Campaign Playbooks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col items-start p-4 hover:border-primary">
              <Megaphone className="h-5 w-5 mb-2 text-primary" />
              <div className="font-semibold mb-1">Flash Sale</div>
              <div className="text-xs text-muted-foreground text-left">Create urgency with limited-time offers</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 hover:border-primary">
              <Calendar className="h-5 w-5 mb-2 text-success" />
              <div className="font-semibold mb-1">Payday Promo</div>
              <div className="text-xs text-muted-foreground text-left">Target 15th & 30th with special deals</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 hover:border-primary">
              <TrendingUp className="h-5 w-5 mb-2 text-warning" />
              <div className="font-semibold mb-1">Trending Product</div>
              <div className="text-xs text-muted-foreground text-left">Leverage viral products and trends</div>
            </Button>
            <Button variant="outline" className="h-auto flex-col items-start p-4 hover:border-primary">
              <Eye className="h-5 w-5 mb-2 text-accent" />
              <div className="font-semibold mb-1">New Arrival</div>
              <div className="text-xs text-muted-foreground text-left">Announce new products with impact</div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {adCampaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 rounded-lg border bg-card hover:shadow-md transition-smooth">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{campaign.title}</h3>
                      <Badge variant={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                      <Badge variant="outline" className={getPlatformColor(campaign.platform)}>
                        {campaign.platform}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{campaign.type}</p>
                  </div>
                </div>

                <div className="mb-3 p-3 rounded bg-muted/50 text-sm">
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
                    {campaign.status === "published" && (
                      <>
                        <span>Views: <strong className="text-foreground">{campaign.engagement.views.toLocaleString()}</strong></span>
                        <span>Clicks: <strong className="text-foreground">{campaign.engagement.clicks.toLocaleString()}</strong></span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === "draft" && (
                      <>
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button size="sm">Schedule</Button>
                      </>
                    )}
                    {campaign.status === "scheduled" && (
                      <>
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button variant="destructive" size="sm">Cancel</Button>
                      </>
                    )}
                    {campaign.status === "published" && (
                      <Button variant="outline" size="sm">View Analytics</Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
