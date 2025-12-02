import { Search, Bell, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

const faqItems = [
  {
    question: "How do I add a new product?",
    answer: "Click the 'Add Product' button and fill in the product details including name, SKU, price, and initial inventory."
  },
  {
    question: "What do the status badges mean?",
    answer: "Critical: Stock running low, Expiring: Products near expiry date, Slow: Products with low sales velocity."
  },
  {
    question: "How often is the inventory analyzed?",
    answer: "The AI-powered analysis runs every hour to detect at-risk items and provide recommendations."
  },
  {
    question: "Can I sync multiple platforms?",
    answer: "Yes! SmartShelf supports Shopee, Lazada, and TikTok Shop. Connect your accounts in Settings."
  },
  {
    question: "How do I implement the recommendations?",
    answer: "Review the recommended actions for each product and execute them directly through the platform connections."
  },
];

export function PageHeader({
  title,
  description,
  searchPlaceholder = "Search for query...",
  onSearch,
}: PageHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [faqOpen, setFaqOpen] = useState(false);
  const [notifications] = useState(3);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="relative w-80 hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Notification Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notifications > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {notifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-4 space-y-3">
                <h3 className="font-semibold">Notifications</h3>
                <DropdownMenuItem className="flex flex-col items-start py-2">
                  <p className="font-medium text-sm">Stock Alert: Wireless Earbuds Pro</p>
                  <p className="text-xs text-muted-foreground">Only 12 units left in stock</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start py-2">
                  <p className="font-medium text-sm">Expiry Warning: Phone Case Premium</p>
                  <p className="text-xs text-muted-foreground">14 days until expiry</p>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start py-2">
                  <p className="font-medium text-sm">Analysis Complete</p>
                  <p className="text-xs text-muted-foreground">5 at-risk items detected</p>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* FAQ Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFaqOpen(true)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* FAQ Dialog */}
      <Dialog open={faqOpen} onOpenChange={setFaqOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Frequently Asked Questions</DialogTitle>
            <DialogDescription>
              Find answers to common questions about SmartShelf
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {faqItems.map((item, index) => (
              <div key={index} className="space-y-2">
                <h3 className="font-semibold text-sm">{item.question}</h3>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
                {index < faqItems.length - 1 && <div className="border-t" />}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
