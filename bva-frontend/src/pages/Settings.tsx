import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, RefreshCw, User, Lock, Palette, Save, Loader2, Trash2, TestTube } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import { toast } from "sonner";
import { integrationService, Integration } from "@/services/integration.service";
import { IntegrationAgreementDialog } from "@/components/IntegrationAgreementDialog";
import { ShopeeCloneIntegrationModal } from "@/components/ShopeeCloneIntegrationModal";
import { LazadaIntegrationModal } from "@/components/LazadaIntegrationModal";
import { Skeleton } from "@/components/ui/skeleton";
import { shopAccessApi } from "@/lib/api";

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Profile Form State - Initialize from user data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // Initialize form fields when user data is available
  useEffect(() => {
    if (user) {
      const nameParts = user.name?.split(" ") || [];
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Integration State
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);
  const [showShopeeModal, setShowShopeeModal] = useState(false);
  const [showLazadaModal, setShowLazadaModal] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"SHOPEE" | "LAZADA" | "TIKTOK" | "OTHER">("SHOPEE");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile Update Mutation
  const { refreshUser } = useAuth();
  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: async (data) => {
      toast.success("Profile updated successfully");
      
      // Refresh user data from server to get updated information
      try {
        if (refreshUser) {
          await refreshUser();
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }
      
      // Update local form fields with the response data
      if (data && (data as any).data) {
        const updatedUser = (data as any).data;
        if (updatedUser.firstName || updatedUser.lastName || updatedUser.name) {
          const nameParts = updatedUser.name?.split(" ") || 
                           (updatedUser.firstName && updatedUser.lastName 
                             ? [`${updatedUser.firstName}`, updatedUser.lastName]
                             : updatedUser.firstName 
                               ? [updatedUser.firstName]
                               : []);
          setFirstName(nameParts[0] || updatedUser.firstName || "");
          setLastName(nameParts.slice(1).join(" ") || updatedUser.lastName || "");
        }
        if (updatedUser.email) {
          setEmail(updatedUser.email);
        }
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to update profile";
      toast.error(errorMessage);
      console.error("Profile update error:", error);
    },
  });

  // Password Update Mutation
  const updatePasswordMutation = useMutation({
    mutationFn: userApi.updatePassword,
    onSuccess: () => {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update password");
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build update object with only changed fields
    const updates: { firstName?: string; lastName?: string; email?: string } = {};
    
    // Only include fields that have changed from the original user data
    const originalNameParts = user?.name?.split(" ") || [];
    const originalFirstName = originalNameParts[0] || "";
    const originalLastName = originalNameParts.slice(1).join(" ") || "";
    const originalEmail = user?.email || "";
    
    if (firstName !== originalFirstName) {
      updates.firstName = firstName;
    }
    if (lastName !== originalLastName) {
      updates.lastName = lastName;
    }
    if (email !== originalEmail) {
      updates.email = email;
    }
    
    // If no changes, show message and return
    if (Object.keys(updates).length === 0) {
      toast.info("No changes to save");
      return;
    }
    
    // Update only changed fields
    updateProfileMutation.mutate(updates as any);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  // Integration Queries and Mutations
  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrationService.getIntegrations(),
  });

  const createIntegrationMutation = useMutation({
    mutationFn: (data: { platform: string }) =>
      integrationService.createIntegration(data as any),
    onSuccess: () => {
      // Invalidate integrations query to refresh status
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      // Invalidate dependent queries that rely on integration status
      queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["at-risk-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["restock"] });
      toast.success("Integration connected successfully! You can now sync your data.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to connect integration");
    },
  });

  const syncIntegrationMutation = useMutation({
    mutationFn: (id: string) => integrationService.syncIntegration(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      // Handle both wrapped and unwrapped response formats
      // apiClient.post unwraps { success: true, data: {...} } to just {...}
      // So data might be { products, sales } directly or { data: { products, sales } }
      const products = data?.data?.products ?? data?.products ?? 0;
      const sales = data?.data?.sales ?? data?.sales ?? 0;
      if (products > 0 || sales > 0) {
        toast.success(`Sync completed! ${products} products, ${sales} sales synced.`);
      } else {
        toast.success("Sync completed successfully!");
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to sync integration");
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: string) => integrationService.testConnection(id),
    onSuccess: (data) => {
      toast.success(data.message || "Connection test successful!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Connection test failed");
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: (id: string) => integrationService.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      // Also invalidate dependent queries that rely on integration status
      queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["at-risk-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["restock"] });
      toast.success("Integration disconnected successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to disconnect integration");
    },
  });

  const handleConnectIntegration = (platform: "SHOPEE" | "LAZADA" | "TIKTOK" | "OTHER") => {
    setSelectedPlatform(platform);
    if (platform === "SHOPEE") {
      setShowShopeeModal(true);
    } else if (platform === "LAZADA") {
      setShowLazadaModal(true);
    } else {
      setShowAgreementDialog(true);
    }
  };

  const handleAgreeToIntegration = async () => {
    await createIntegrationMutation.mutateAsync({
      platform: selectedPlatform,
    });
  };

  const handleShopeeConnect = async (shopId: string, shopName: string, shopeeToken: string) => {
    try {
      // First, link the shop
      console.log(`🔗 Linking shop ${shopId} (${shopName})...`);
      const linkResult = await shopAccessApi.linkShop(shopId);
      console.log(`✅ Shop linked successfully:`, linkResult);
      
      if (!linkResult || !linkResult.shop) {
        throw new Error("Failed to link shop: Invalid response from server");
      }
      
      // Refresh user data to get updated shops list
      if (refreshUser) {
        await refreshUser();
      }
      
      // Wait a bit to ensure the backend has processed the link
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then, create the integration with Shopee-Clone token
      console.log(`🔗 Creating SHOPEE integration with token...`);
      try {
        await createIntegrationMutation.mutateAsync({
          platform: "SHOPEE",
          shopeeToken: shopeeToken, // Pass the Shopee-Clone token
        } as any);
        console.log(`✅ Integration created successfully`);
        
        // Force refresh integrations query
        await queryClient.invalidateQueries({ queryKey: ["integrations"] });
        // Wait a bit for the query to refetch
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        // Handle 409 Conflict - Integration already exists
        if (error.response?.status === 409 || error.message?.includes("already exists")) {
          console.log(`ℹ️ Integration already exists, treating as success...`);
          toast.success("Integration already active. Refreshing data...");
          
          // Get existing integration and proceed to sync
          const integrations = await integrationService.getIntegrations();
          const shopeeIntegration = integrations.find(i => i.platform === "SHOPEE");
          
          if (shopeeIntegration) {
            console.log(`🔄 Syncing existing integration data...`);
            await syncIntegrationMutation.mutateAsync(shopeeIntegration.id);
            console.log(`✅ Integration synced successfully`);
            return; // Exit early, sync is complete
          } else {
            // If we can't find it, try to create again (might have been created between calls)
            console.log(`⚠️ Integration not found, retrying creation...`);
            await createIntegrationMutation.mutateAsync({
              platform: "SHOPEE",
              shopeeToken: shopeeToken,
            } as any);
          }
        } else {
          // Re-throw other errors
          throw error;
        }
      }

      // Sync the integration to fetch seller data
      const integrations = await integrationService.getIntegrations();
      const shopeeIntegration = integrations.find(i => i.platform === "SHOPEE");
      if (shopeeIntegration) {
        console.log(`🔄 Manually syncing integration data...`);
        try {
          await syncIntegrationMutation.mutateAsync(shopeeIntegration.id);
          console.log(`✅ Integration synced successfully`);
          toast.success("Shopee-Clone connected successfully! Seller data synced.");
        } catch (syncError: any) {
          console.error(`⚠️ Sync failed:`, syncError);
          toast.info("Integration created. Auto-sync in progress...");
        }
      } else {
        console.log(`ℹ️ Integration not found for manual sync - auto-sync should handle it`);
        toast.success("Shopee-Clone integration created! Data is being synced automatically.");
      }
    } catch (error: any) {
      console.error(`❌ Error in handleShopeeConnect:`, error);
      
      // Enhanced error handling for 409
      if (error.response?.status === 409) {
        toast.success("Integration already active. Refreshing data...");
        // Try to sync anyway
        try {
          const integrations = await integrationService.getIntegrations();
          const shopeeIntegration = integrations.find(i => i.platform === "SHOPEE");
          if (shopeeIntegration) {
            await syncIntegrationMutation.mutateAsync(shopeeIntegration.id);
          }
        } catch (syncError) {
          console.error("Failed to sync after 409:", syncError);
        }
        return; // Don't throw, treat as success
      }
      
      throw error;
    }
  };

  const handleLazadaConnect = async (shopId: string, shopName: string, lazadaToken: string) => {
    try {
      // First, link the shop
      console.log(`🔗 Linking shop ${shopId} (${shopName})...`);
      const linkResult = await shopAccessApi.linkShop(shopId);
      console.log(`✅ Shop linked successfully:`, linkResult);
      
      if (!linkResult || !linkResult.shop) {
        throw new Error("Failed to link shop: Invalid response from server");
      }
      
      // Refresh user data to get updated shops list
      if (refreshUser) {
        await refreshUser();
      }
      
      // Wait a bit to ensure the backend has processed the link
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Then, create the integration with Lazada-Clone token
      console.log(`🔗 Creating LAZADA integration with token...`);
      try {
        await createIntegrationMutation.mutateAsync({
          platform: "LAZADA",
          lazadaToken: lazadaToken, // Pass the Lazada-Clone token
        } as any);
        console.log(`✅ Integration created successfully`);
        
        // Force refresh integrations query
        await queryClient.invalidateQueries({ queryKey: ["integrations"] });
        // Wait a bit for the query to refetch
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        // Handle 409 Conflict - Integration already exists
        if (error.response?.status === 409 || error.message?.includes("already exists")) {
          console.log(`ℹ️ Integration already exists, treating as success...`);
          toast.success("Integration already active. Refreshing data...");
          
          // Get existing integration and proceed to sync
          const integrations = await integrationService.getIntegrations();
          const lazadaIntegration = integrations.find(i => i.platform === "LAZADA");
          
          if (lazadaIntegration) {
            console.log(`🔄 Syncing existing integration data...`);
            await syncIntegrationMutation.mutateAsync(lazadaIntegration.id);
            console.log(`✅ Integration synced successfully`);
            return; // Exit early, sync is complete
          } else {
            // If we can't find it, try to create again (might have been created between calls)
            console.log(`⚠️ Integration not found, retrying creation...`);
            await createIntegrationMutation.mutateAsync({
              platform: "LAZADA",
              lazadaToken: lazadaToken,
            } as any);
          }
        } else {
          // Re-throw other errors
          throw error;
        }
      }

      // Sync the integration to fetch seller data
      const integrations = await integrationService.getIntegrations();
      const lazadaIntegration = integrations.find(i => i.platform === "LAZADA");
      if (lazadaIntegration) {
        console.log(`🔄 Manually syncing integration data...`);
        try {
          await syncIntegrationMutation.mutateAsync(lazadaIntegration.id);
          console.log(`✅ Integration synced successfully`);
          toast.success("Lazada-Clone connected successfully! Seller data synced.");
        } catch (syncError: any) {
          console.error(`⚠️ Sync failed:`, syncError);
          toast.info("Integration created. Auto-sync in progress...");
        }
      } else {
        console.log(`ℹ️ Integration not found for manual sync - auto-sync should handle it`);
        toast.success("Lazada-Clone integration created! Data is being synced automatically.");
      }
    } catch (error: any) {
      console.error(`❌ Error in handleLazadaConnect:`, error);
      
      // Enhanced error handling for 409
      if (error.response?.status === 409) {
        toast.success("Integration already active. Refreshing data...");
        // Try to sync anyway
        try {
          const integrations = await integrationService.getIntegrations();
          const lazadaIntegration = integrations.find(i => i.platform === "LAZADA");
          if (lazadaIntegration) {
            await syncIntegrationMutation.mutateAsync(lazadaIntegration.id);
          }
        } catch (syncError) {
          console.error("Failed to sync after 409:", syncError);
        }
        return; // Don't throw, treat as success
      }
      
      throw error;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "SHOPEE":
        return "Shopee-Clone";
      case "LAZADA":
        return "Lazada";
      case "TIKTOK":
        return "TikTok Shop";
      default:
        return platform;
    }
  };

  const getPlatformLogo = (platform: string) => {
    // Return placeholder or actual logo path
    return "/shopee-logo.png";
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">⚙️ Settings</h1>
          <p className="text-muted-foreground">Manage your account and integrations</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-card-sm p-1 mb-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2">
            <Lock className="h-4 w-4" />
            Account & Security
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Link2 className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground">Personal Information</CardTitle>
              <CardDescription className="text-muted-foreground">Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      className="glass-card-sm border-card-glass-border" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      className="glass-card-sm border-card-glass-border" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="glass-card-sm border-card-glass-border" 
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updateProfileMutation.isPending} className="gap-2">
                    {updateProfileMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground">Change Password</CardTitle>
              <CardDescription className="text-muted-foreground">Ensure your account is using a long, random password to stay secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="glass-card-sm border-card-glass-border" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="glass-card-sm border-card-glass-border" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glass-card-sm border-card-glass-border" 
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={updatePasswordMutation.isPending} className="gap-2">
                    {updatePasswordMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground">🔗 Platform Integrations</CardTitle>
              <CardDescription className="text-muted-foreground">Connect and manage your e-commerce platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrationsLoading ? (
                <div className="space-y-4">
                  {/* Skeleton loading for integrations */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 glass-card-sm">
                      <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : integrations && integrations.length > 0 ? (
                <>
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 glass-card-sm hover:shadow-glow transition-smooth">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 glass-card-sm flex items-center justify-center p-1.5 overflow-hidden">
                          <img 
                            src={getPlatformLogo(integration.platform)} 
                            alt={getPlatformName(integration.platform)}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{getPlatformName(integration.platform)}</h3>
                            <Badge variant="default" className="bg-success text-success-foreground">
                              Connected
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Connected on {new Date(integration.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 glass-card-sm"
                          onClick={() => testConnectionMutation.mutate(integration.id)}
                          disabled={testConnectionMutation.isPending}
                        >
                          <TestTube className="h-3 w-3" />
                          Test
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 glass-card-sm"
                          onClick={() => syncIntegrationMutation.mutate(integration.id)}
                          disabled={syncIntegrationMutation.isPending}
                        >
                          {syncIntegrationMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          Sync
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-destructive/10 text-destructive"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to disconnect this integration?")) {
                              deleteIntegrationMutation.mutate(integration.id);
                            }
                          }}
                          disabled={deleteIntegrationMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No integrations connected yet.</p>
                  <p className="text-sm">Connect a platform to start syncing your data.</p>
                </div>
              )}

              {/* Available Platforms */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-sm mb-4">Available Platforms</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(["SHOPEE", "LAZADA", "TIKTOK"] as const).map((platform) => {
                    const isConnected = integrations?.some(i => i.platform === platform);
                    return (
                      <Button
                        key={platform}
                        variant={isConnected ? "outline" : "default"}
                        className="justify-start gap-2"
                        onClick={() => handleConnectIntegration(platform)}
                      >
                        <Link2 className="h-4 w-4" />
                        {getPlatformName(platform)}
                        {isConnected && " (Connected)"}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground">Appearance</CardTitle>
              <CardDescription className="text-muted-foreground">Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 glass-card-sm hover:shadow-glow transition-smooth">
                  <div>
                    <div className="font-medium text-foreground">Theme Preference</div>
                    <div className="text-sm text-muted-foreground">Select your preferred theme (Light/Dark)</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="glass-card-sm">Light</Button>
                    <Button variant="outline" className="glass-card-sm">Dark</Button>
                    <Button variant="default" className="glass-card-sm">System</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Agreement Dialog */}
      <IntegrationAgreementDialog
        open={showAgreementDialog}
        onOpenChange={setShowAgreementDialog}
        platform={selectedPlatform}
        onAgree={handleAgreeToIntegration}
      />

      {/* Shopee-Clone Integration Modal */}
      <ShopeeCloneIntegrationModal
        open={showShopeeModal}
        onOpenChange={setShowShopeeModal}
        onConnect={handleShopeeConnect}
      />
      
      {/* Lazada-Clone Integration Modal */}
      <LazadaIntegrationModal
        open={showLazadaModal}
        onOpenChange={setShowLazadaModal}
        onConnect={handleLazadaConnect}
      />
    </div>
  );
}
