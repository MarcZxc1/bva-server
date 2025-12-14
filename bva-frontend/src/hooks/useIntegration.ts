import { useQuery } from "@tanstack/react-query";
import { integrationService, Integration } from "@/services/integration.service";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to check if user has an active integration with terms accepted
 * 
 * This hook:
 * - Only fetches when user is authenticated and has a shop
 * - Returns false by default (not connected) until integration is explicitly created
 * - Persists integration status across page refreshes (stored in database)
 * - Automatically refetches when user logs in
 */
export function useIntegration() {
  const { isAuthenticated, user } = useAuth();
  const hasShop = !!user?.shops?.[0]?.id;

  const { data: integrations, isLoading, error, refetch } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrationService.getIntegrations(),
    enabled: isAuthenticated && hasShop, // Only fetch when authenticated and has shop
    staleTime: 0, // Always fetch fresh data
    gcTime: 1 * 60 * 1000, // 1 minute - keep in cache for 1 minute
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnMount: true, // Refetch when component mounts (ensures fresh data on login)
  });

  // Check if there's an active integration with terms accepted
  // Default to false (not connected) unless explicitly found
  const hasActiveIntegration = integrations?.some((integration) => {
    const settings = integration.settings as any;
    // Integration is active if terms are accepted AND isActive is not false
    return settings?.termsAccepted === true && settings?.isActive !== false;
  }) || false;

  // Check if user has linked shops (for BVA users linking Shopee-Clone shops)
  // This checks if user has any shops (owned or linked)
  const hasLinkedShops = hasShop;

  // Platform is connected if there's an active integration OR linked shops
  const isPlatformConnected = hasActiveIntegration || hasLinkedShops;

  const activeIntegration = integrations?.find((integration) => {
    const settings = integration.settings as any;
    return settings?.termsAccepted === true && settings?.isActive !== false;
  });

  // Get connected platforms (which platforms have active integrations)
  // Only include platforms where termsAccepted is true and isActive is not false
  const connectedPlatforms = new Set(
    integrations
      ?.filter((integration) => {
        const settings = integration.settings as any;
        return settings?.termsAccepted === true && settings?.isActive !== false;
      })
      .map((integration) => integration.platform) || []
  );

  // Debug logging
  console.log('🔌 Integration Status:', {
    integrations: integrations?.length || 0,
    integrationsDetail: integrations?.map(i => ({
      platform: i.platform,
      shopId: i.shopId,
      settings: i.settings
    })),
    connectedPlatforms: Array.from(connectedPlatforms),
    hasActiveIntegration,
  });

  return {
    integrations: integrations || [],
    hasActiveIntegration,
    isPlatformConnected, // True if integration exists OR linked shops exist
    activeIntegration,
    connectedPlatforms, // Set of connected platform names (e.g., "SHOPEE", "LAZADA")
    isLoading,
    error,
    refetch, // Expose refetch for manual refresh if needed
  };
}

