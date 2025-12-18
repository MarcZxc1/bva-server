import { useState } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { notificationApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAllUserAtRiskInventory, useExpiredItems } from "@/hooks/useSmartShelf";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  isRead: boolean;
  createdAt: string;
}

export function NotificationsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch notifications
  const { data: notificationsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await notificationApi.getAll();
      return response;
    },
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch at-risk inventory
  const { data: atRiskData, isLoading: isLoadingAtRisk } = useAllUserAtRiskInventory(true);
  
  // Fetch expired items
  const { data: expiredItems, isLoading: isLoadingExpired } = useExpiredItems(true);

  const notifications: Notification[] = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Get critical items (score >= 80)
  const criticalItems = atRiskData?.at_risk?.filter(item => item.score >= 80) || [];
  
  // Get at-risk items (all flagged items, excluding critical)
  const atRiskItems = atRiskData?.at_risk?.filter(item => item.score < 80) || [];
  
  // Get expired items count
  const expiredCount = expiredItems?.length || 0;

  // Total count for badge (notifications + critical items + expired items)
  const totalAlertCount = unreadCount + criticalItems.length + expiredCount;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const isLoading = isLoadingNotifications || isLoadingAtRisk || isLoadingExpired;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-md relative text-foreground hover:bg-primary/10">
          <Bell className="h-5 w-5" />
          {totalAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {totalAlertCount > 9 ? '9+' : totalAlertCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0 glass-card border-card-glass-border" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
            <TabsTrigger 
              value="all" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              All
              {totalAlertCount > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {totalAlertCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="critical" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Critical
              {criticalItems.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {criticalItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="at-risk" 
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              At-Risk
              {atRiskItems.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1.5 text-xs">
                  {atRiskItems.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* All Tab */}
                <TabsContent value="all" className="m-0 p-0">
                  <div className="flex flex-col">
                    {/* Expired Items */}
                    {expiredCount > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-2 bg-destructive/10 border-b border-destructive/20">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <p className="text-xs font-semibold text-destructive">🚨 Expired Items ({expiredCount})</p>
                          </div>
                        </div>
                        {expiredItems?.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="p-4 border-b border-destructive/20 hover:bg-destructive/5 transition-colors cursor-pointer"
                            onClick={() => {
                              navigate("/smartshelf");
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <div className="mt-1">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-destructive">
                                    {item.name}
                                  </p>
                                  <Badge variant="destructive" className="text-xs bg-destructive">
                                    EXPIRED
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  SKU: {item.sku}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Stock: {item.stock || item.quantity || 0}</span>
                                  {item.expiryDate && (
                                    <span>Expired: {new Date(item.expiryDate).toLocaleDateString()}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {expiredCount > 3 && (
                          <div className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                navigate("/smartshelf");
                                setIsOpen(false);
                              }}
                            >
                              View all {expiredCount} expired items
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Critical Items */}
                    {criticalItems.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-2 bg-destructive/5 border-b border-border">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <p className="text-xs font-semibold text-destructive">Critical Items ({criticalItems.length})</p>
                          </div>
                        </div>
                        {criticalItems.slice(0, 5).map((item) => (
                          <div
                            key={item.product_id}
                            className="p-4 border-b border-border hover:bg-primary/5 transition-colors cursor-pointer"
                            onClick={() => {
                              navigate("/smartshelf");
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <div className="mt-1">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-semibold text-foreground">
                                    {item.name}
                                  </p>
                                  <Badge variant="destructive" className="text-xs">
                                    Score: {item.score}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {item.reasons.join(", ")}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Stock: {item.current_quantity}</span>
                                  {item.days_to_expiry !== undefined && (
                                    <span>Expires in: {item.days_to_expiry} days</span>
                                  )}
                                </div>
                                <p className="text-xs font-medium text-destructive mt-1">
                                  {item.recommended_action.action_type}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {criticalItems.length > 5 && (
                          <div className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                navigate("/smartshelf");
                                setIsOpen(false);
                              }}
                            >
                              View all {criticalItems.length} critical items
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* At-Risk Items */}
                    {atRiskItems.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-2 bg-warning/5 border-b border-border">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            <p className="text-xs font-semibold text-warning">At-Risk Items ({atRiskItems.length})</p>
                          </div>
                        </div>
                        {atRiskItems.slice(0, 3).map((item) => (
                          <div
                            key={item.product_id}
                            className="p-4 border-b border-border hover:bg-primary/5 transition-colors cursor-pointer"
                            onClick={() => {
                              navigate("/smartshelf");
                              setIsOpen(false);
                            }}
                          >
                            <div className="flex gap-3">
                              <div className="mt-1">
                                <AlertTriangle className="h-4 w-4 text-warning" />
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-foreground">
                                    {item.name}
                                  </p>
                                  <Badge variant="secondary" className="text-xs">
                                    Score: {item.score}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {item.reasons.slice(0, 2).join(", ")}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>Stock: {item.current_quantity}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {atRiskItems.length > 3 && (
                          <div className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => {
                                navigate("/smartshelf");
                                setIsOpen(false);
                              }}
                            >
                              View all {atRiskItems.length} at-risk items
                            </Button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Regular Notifications */}
                    {notifications.length > 0 && (
                      <>
                        <div className="px-4 pt-3 pb-2 bg-primary/5 border-b border-border">
                          <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary" />
                            <p className="text-xs font-semibold text-primary">System Notifications ({notifications.length})</p>
                          </div>
                        </div>
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-border last:border-0 hover:bg-primary/5 transition-colors ${
                              !notification.isRead ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="mt-1">{getIcon(notification.type)}</div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${!notification.isRead ? "font-semibold" : "font-medium"}`}>
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 text-muted-foreground hover:text-primary"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      title="Mark as read"
                                    >
                                      <Check className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {notification.message}
                                </p>
                                <p className="text-[10px] text-muted-foreground/70">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {expiredCount === 0 && criticalItems.length === 0 && atRiskItems.length === 0 && notifications.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                    )}
                  </div>
                </TabsContent>

                {/* Critical Tab */}
                <TabsContent value="critical" className="m-0 p-0">
                  <div className="flex flex-col">
                    {criticalItems.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No critical items</div>
                    ) : (
                      criticalItems.map((item) => (
                        <div
                          key={item.product_id}
                          className="p-4 border-b border-border hover:bg-primary/5 transition-colors cursor-pointer"
                          onClick={() => {
                            navigate("/smartshelf");
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="mt-1">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-semibold text-foreground">
                                  {item.name}
                                </p>
                                <Badge variant="destructive" className="text-xs">
                                  Score: {item.score}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.reasons.join(", ")}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Stock: {item.current_quantity}</span>
                                {item.days_to_expiry !== undefined && (
                                  <span>Expires in: {item.days_to_expiry} days</span>
                                )}
                              </div>
                              <p className="text-xs font-medium text-destructive mt-1">
                                {item.recommended_action.action_type}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* At-Risk Tab */}
                <TabsContent value="at-risk" className="m-0 p-0">
                  <div className="flex flex-col">
                    {atRiskItems.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No at-risk items</div>
                    ) : (
                      atRiskItems.map((item) => (
                        <div
                          key={item.product_id}
                          className="p-4 border-b border-border hover:bg-primary/5 transition-colors cursor-pointer"
                          onClick={() => {
                            navigate("/smartshelf");
                            setIsOpen(false);
                          }}
                        >
                          <div className="flex gap-3">
                            <div className="mt-1">
                              <AlertTriangle className="h-4 w-4 text-warning" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {item.name}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  Score: {item.score}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {item.reasons.join(", ")}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Stock: {item.current_quantity}</span>
                                {item.days_to_expiry !== undefined && (
                                  <span>Expires in: {item.days_to_expiry} days</span>
                                )}
                              </div>
                              <p className="text-xs font-medium text-warning mt-1">
                                {item.recommended_action.action_type}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
