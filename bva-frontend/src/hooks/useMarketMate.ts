/**
 * React Query hooks for MarketMate (AI Ad Generation)
 * 
 * Handles API communication for AI-powered ad generation
 */

import { useMutation } from "@tanstack/react-query";
import { aiService, GenerateAdRequest, GenerateAdCopyRequest } from "@/api/ai.service";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

/**
 * Hook for generating complete ad (copy + image)
 * Usage: const { mutate, data, isPending } = useGenerateAd();
 */
export function useGenerateAd() {
  return useMutation({
    mutationFn: async (request: GenerateAdRequest) => {
      return aiService.generateCompleteAd(request);
    },
    onSuccess: () => {
      toast.success("Ad generated successfully!");
    },
    onError: (error: ErrorResponse) => {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = 
        axiosError?.response?.data?.message ||
        axiosError?.response?.data?.error ||
        error.message ||
        "Failed to generate ad";
      
      toast.error(errorMessage);
    },
  });
}

/**
 * Hook for generating ad copy only (faster)
 * Usage: const { mutate, data, isPending } = useGenerateAdCopy();
 */
export function useGenerateAdCopy() {
  return useMutation({
    mutationFn: async (request: GenerateAdCopyRequest) => {
      return aiService.generateAdCopy(request);
    },
    onSuccess: () => {
      toast.success("Ad copy generated successfully!");
    },
    onError: (error: ErrorResponse) => {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = 
        axiosError?.response?.data?.message ||
        axiosError?.response?.data?.error ||
        error.message ||
        "Failed to generate ad copy";
      
      toast.error(errorMessage);
    },
  });
}
