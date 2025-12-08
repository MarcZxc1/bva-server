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
    staleTime: 5 * 60 * 1000, // 5 minutes - cache for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
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

  const activeIntegration = integrations?.find((integration) => {
    const settings = integration.settings as any;
    return settings?.termsAccepted === true && settings?.isActive !== false;
  });

  return {
    integrations: integrations || [],
    hasActiveIntegration,
    activeIntegration,
    isLoading,
    error,
    refetch, // Expose refetch for manual refresh if needed
  };
}

