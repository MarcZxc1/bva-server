import { useMutation } from "@tanstack/react-query";
import { restockService, RestockStrategyRequest, RestockStrategyResponse } from "@/services/restock.service";
import { useToast } from "@/hooks/use-toast";

export function useRestock() {
  // Hook for generating restock strategy
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RestockStrategyRequest): Promise<RestockStrategyResponse> => {
      return restockService.getRestockPlan(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate restock strategy",
        variant: "destructive",
      });
    },
  });
}

