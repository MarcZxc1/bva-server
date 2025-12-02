import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Megaphone,
  Sparkles,
  Calendar,
  Eye,
  TrendingUp,
  Copy,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { aiService } from "@/api/ai.service";

const adCampaigns = [
  {
    id: 1,
    title: "Flash Sale - Wireless Earbuds",
    type: "Limited Offer",
    platform: "Shopee",
    status: "scheduled",
    scheduledDate: "2025-11-01 10:00 AM",
    caption:
      "🎧 FLASH SALE ALERT! Premium Wireless Earbuds Pro now 40% OFF! Crystal clear sound, 24hr battery life. Limited stocks - grab yours now! #ShopeeFinds #TechDeals #WirelessEarbuds",
    engagement: { views: 0, clicks: 0 },
  },
  {
    id: 2,
    title: "Payday Sale - Smart Watch",
    type: "Payday Promo",
    platform: "Lazada",
    status: "published",
    scheduledDate: "2025-10-28 09:00 AM",
    caption:
      "💰 PAYDAY TREAT! Smart Watch Series 5 - Track your fitness goals in style. FREE shipping + extra 15% off this payday weekend! Limited time only! #PaydaySale #SmartWatch #FitnessGoals",
    engagement: { views: 2450, clicks: 342 },
  },
  {
    id: 3,
    title: "Trending Product - Phone Accessories",
    type: "Viral Content",
    platform: "TikTok",
    status: "draft",
    scheduledDate: null,
    caption:
      "📱 Must-have phone accessories that went viral! Premium cases + screen protectors + fast charging cables. Bundle deal - Save 50%! Tag a friend who needs this! #TikTokMadeMeBuyIt #PhoneAccessories #ViralProducts",
    engagement: { views: 0, clicks: 0 },
  },
  {
    id: 4,
    title: "New Arrival - Power Banks",
    type: "Product Launch",
    platform: "Shopee",
    status: "published",
    scheduledDate: "2025-10-27 02:00 PM",
    caption:
      "🔋 NEW ARRIVAL! 20000mAh Power Bank - Never run out of battery again! Fast charging, compact design, perfect for travel. Limited launch promo - 30% OFF first 100 orders! #NewArrival #PowerBank #TravelEssentials",
    engagement: { views: 1890, clicks: 267 },
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "published":
      return "success";
    case "scheduled":
      return "secondary";
    case "draft":
      return "outline";
    default:
      return "outline";
  }
};

export default function MarketMate() {
  const [productName, setProductName] = useState("");
  const [playbook, setPlaybook] = useState("flash_sale");
  const [discount, setDiscount] = useState("");

  const [generatedText, setGeneratedText] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [loadingText, setLoadingText] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);

  const handleGenerateText = async () => {
    if (!productName) {
      toast.error("Please enter a product name");
      return;
    }
    setLoadingText(true);
    try {
      const response = await aiService.generateAdCopy({
        productName,
        playbook,
        discount,
      });
      if (response.success && response.data) {
        setGeneratedText(response.data.generated_ad_copy);
        toast.success("Ad copy generated!");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "AI Service Busy, please try again.";
      toast.error(errorMessage);
    } finally {
      setLoadingText(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!productName) {
      toast.error("Please enter a product name");
      return;
    }
    setLoadingImage(true);
    try {
      const response = await aiService.generateAdImage({
        productName,
        playbook,
      });
      if (response.success && response.data) {
        setGeneratedImage(response.data.image_url);
        toast.success("Ad image generated!");
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message || "AI Service Busy, please try again.";
      toast.error(errorMessage);
    } finally {
      setLoadingImage(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          MarketMate AI
        </h1>
        <p className="text-muted-foreground">
          Generate high-converting ad creatives and manage campaigns
        </p>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList>
          <TabsTrigger value="generator">Ad Generator</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Create New Ad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    placeholder="e.g. Wireless Earbuds Pro"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="playbook">Playbook Strategy</Label>
                  <Select value={playbook} onValueChange={setPlaybook}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flash_sale">
                        Flash Sale (Urgency)
                      </SelectItem>
                      <SelectItem value="new_arrival">
                        New Arrival (Hype)
                      </SelectItem>
                      <SelectItem value="bestseller">
                        Bestseller (Social Proof)
                      </SelectItem>
                      <SelectItem value="bundle">
                        Bundle Deal (Value)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Offer (Optional)</Label>
                  <Input
                    id="discount"
                    placeholder="e.g. 50% OFF"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleGenerateText}
                    disabled={loadingText}
                    className="flex-1"
                  >
                    {loadingText ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Megaphone className="mr-2 h-4 w-4" />
                    )}
                    Generate Text
                  </Button>
                  <Button
                    onClick={handleGenerateImage}
                    disabled={loadingImage}
                    variant="secondary"
                    className="flex-1"
                  >
                    {loadingImage ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ImageIcon className="mr-2 h-4 w-4" />
                    )}
                    Generate Image
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results Preview */}
            <div className="space-y-6">
              {/* Text Result */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Generated Copy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedText ? (
                    <div className="relative">
                      <Textarea
                        readOnly
                        value={generatedText}
                        className="min-h-[120px] resize-none bg-muted/30"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={copyToClipboard}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-[120px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground text-sm">
                      AI text will appear here
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Image Result */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Generated Creative
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingImage ? (
                    <div className="h-[200px] flex items-center justify-center bg-muted/30 rounded-md">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : generatedImage ? (
                    <div className="relative aspect-video rounded-md overflow-hidden border">
                      <img
                        src={generatedImage}
                        alt="AI Generated Ad"
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground text-sm">
                      AI image will appear here
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {adCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="hover:shadow-md transition-smooth"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge
                      variant={getStatusColor(campaign.status) as any}
                      className="capitalize"
                    >
                      {campaign.status}
                    </Badge>
                    <Badge variant="outline">{campaign.platform}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">
                    {campaign.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {campaign.caption}
                  </p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{campaign.engagement.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      <span>{campaign.engagement.clicks.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
