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

export default function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Profile Form State
  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") || "");
  const [email, setEmail] = useState(user?.email || "");

  // Integration State
  const [showAgreementDialog, setShowAgreementDialog] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"SHOPEE" | "LAZADA" | "TIKTOK" | "OTHER">("SHOPEE");

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Profile Update Mutation
  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to update profile");
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
    updateProfileMutation.mutate({ firstName, lastName, email });
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
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration connected successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to connect integration");
    },
  });

  const syncIntegrationMutation = useMutation({
    mutationFn: (id: string) => integrationService.syncIntegration(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success(`Sync completed! ${data.data.products} products, ${data.data.sales} sales synced.`);
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
      toast.success("Integration disconnected successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to disconnect integration");
    },
  });

  const handleConnectIntegration = (platform: "SHOPEE" | "LAZADA" | "TIKTOK" | "OTHER") => {
    setSelectedPlatform(platform);
    setShowAgreementDialog(true);
  };

  const handleAgreeToIntegration = async () => {
    await createIntegrationMutation.mutateAsync({
      platform: selectedPlatform,
    });
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
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
    </div>
  );
}
