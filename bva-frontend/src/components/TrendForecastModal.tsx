/**
 * TrendForecastModal Component
 * Modal that displays event details, predicted trends, and MarketMate integration
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Sparkles, Calendar, AlertCircle, Lightbulb } from "lucide-react";
import { getEventForecast, type EventForecast } from "@/utils/forecastHelpers";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface TrendForecastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  eventName?: string;
  onGenerateAd?: (eventName: string, trendingKeywords: string[]) => void;
}

export function TrendForecastModal({
  open,
  onOpenChange,
  selectedDate,
  eventName,
  onGenerateAd
}: TrendForecastModalProps) {
  const navigate = useNavigate();
  
  if (!selectedDate) return null;

  const forecast: EventForecast | null = getEventForecast(selectedDate);
  const displayEventName = eventName || forecast?.eventName || "Regular Day";
  const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy");

  const handleGenerateAd = () => {
    if (forecast && forecast.trendingKeywords.length > 0) {
      // Navigate to MarketMate with event context
      navigate("/ads", {
        state: {
          event: {
            name: displayEventName,
            date: selectedDate.toISOString(),
            trendingKeywords: forecast.trendingKeywords,
            expectedTraffic: forecast.expectedTraffic,
            demandIncrease: forecast.demandIncrease
          },
          // Use first trending keyword as product name suggestion
          product: {
            name: forecast.trendingKeywords[0] || "Event Product",
            eventContext: displayEventName
          },
          playbook: "Flash Sale" // Default playbook for events
        }
      });
      onOpenChange(false);
    } else if (onGenerateAd) {
      // Fallback to callback if provided
      onGenerateAd(displayEventName, forecast?.trendingKeywords || []);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {displayEventName}
          </DialogTitle>
          <DialogDescription>
            {formattedDate}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Overview */}
          {forecast && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  Event Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Expected Traffic:</span>
                  <Badge
                    variant={forecast.expectedTraffic === "High" ? "destructive" : "secondary"}
                    className={
                      forecast.expectedTraffic === "High"
                        ? "bg-red-500 hover:bg-red-600"
                        : forecast.expectedTraffic === "Normal"
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-gray-500 hover:bg-gray-600"
                    }
                  >
                    {forecast.expectedTraffic}
                  </Badge>
                </div>
                {forecast.demandIncrease && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Demand Increase:</span>
                    <Badge variant="outline" className="text-success border-success">
                      +{forecast.demandIncrease}%
                    </Badge>
                  </div>
                )}
                {forecast.description && (
                  <p className="text-sm text-muted-foreground">{forecast.description}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Insights Section */}
          {forecast && forecast.trendingKeywords.length > 0 ? (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  AI-Predicted Trending Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Based on historical data and market trends, the following product categories
                    are expected to see increased demand around this event:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {forecast.trendingKeywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-sm px-3 py-1 border-primary/30 bg-primary/5"
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                  {forecast.demandIncrease && (
                    <div className="mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium text-foreground">
                        💡 Insight: Demand for these categories typically increases by{" "}
                        <span className="text-primary font-bold">
                          {forecast.demandIncrease}%
                        </span>{" "}
                        during this period.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg">No Special Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This date doesn't have any special events or predicted demand spikes.
                  Consider regular restocking and standard marketing campaigns.
                </p>
              </CardContent>
            </Card>
          )}

          {/* MarketMate Integration */}
          {forecast && forecast.trendingKeywords.length > 0 && (
            <Card className="glass-card border-primary/30 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Create Event Campaign
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Generate AI-powered marketing materials (PubMat/ad caption) specifically
                  tailored for this event and the predicted trending categories.
                </p>
                <Button
                  onClick={handleGenerateAd}
                  className="w-full gap-2 bg-primary hover:bg-primary/90"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Event Ad with MarketMate
                </Button>
                <p className="text-xs text-muted-foreground">
                  This will open MarketMate with pre-filled event context and trending
                  product categories for AI ad generation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

