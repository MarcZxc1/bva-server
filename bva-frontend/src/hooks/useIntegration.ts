import { useQuery } from "@tanstack/react-query";
import { integrationService, Integration } from "@/services/integration.service";

/**
 * Hook to check if user has an active integration with terms accepted
 */
export function useIntegration() {
  const { data: integrations, isLoading, error } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => integrationService.getIntegrations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if there's an active integration with terms accepted
  const hasActiveIntegration = integrations?.some((integration) => {
    const settings = integration.settings as any;
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
  };
}

