import { useMutation } from "@tanstack/react-query";
import { restockService, RestockStrategyRequest, RestockStrategyResponse } from "@/services/restock.service";
import { useToast } from "@/hooks/use-toast";

export function useRestock() {
  // Hook for generating restock strategy
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: RestockStrategyRequest): Promise<RestockStrategyResponse> => {
      console.log("📊 useRestock: Calling restockService with data:", data);
      return restockService.getRestockPlan(data);
    },
    onError: (error: any) => {
      console.error("❌ useRestock error:", error);
      console.error("❌ Error response:", error.response?.data);
      
      const errorData = error.response?.data;
      const errorMessage = errorData?.message 
        || errorData?.error
        || error.message 
        || "Failed to generate restock strategy";
      
      const errorDetails = errorData?.details;
      const invalidProducts = errorData?.invalidProducts;
      
      // Build a user-friendly error description
      let description = errorMessage;
      
      if (errorDetails?.action) {
        description = `${errorMessage}\n\n${errorDetails.action}`;
      }
      
      if (invalidProducts && invalidProducts.length > 0) {
        description += `\n\nSample products with issues:\n${invalidProducts.map((p: any) => 
          `• ${p.name}: ${p.status}`
        ).join('\n')}`;
      }
      
      if (errorDetails?.hint) {
        description += `\n\n💡 ${errorDetails.hint}`;
      }
      
      toast({
        title: errorData?.error || "Error Generating Restock Plan",
        description,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds since it's important info
      });
    },
  });
}

