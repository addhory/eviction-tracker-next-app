"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  lawFirmService,
  LawFirmFilters,
  LawFirmInsert,
  LawFirmUpdate,
} from "@/services/law-firm-service";
import { toast } from "sonner";

const lawFirmKeys = {
  all: ["law-firms"] as const,
  lists: () => [...lawFirmKeys.all, "list"] as const,
  list: (filters: LawFirmFilters) => [...lawFirmKeys.lists(), filters] as const,
  detail: (id: string) => [...lawFirmKeys.all, "detail", id] as const,
};

// Law Firms Query
export function useLawFirms(filters?: LawFirmFilters) {
  return useQuery({
    queryKey: lawFirmKeys.list(filters || {}),
    queryFn: () => lawFirmService.getLawFirms(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Single Law Firm Query
export function useLawFirm(id: string) {
  return useQuery({
    queryKey: lawFirmKeys.detail(id),
    queryFn: () => lawFirmService.getLawFirm(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Create Law Firm Mutation
export function useCreateLawFirm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LawFirmInsert) => lawFirmService.createLawFirm(data),
    onSuccess: (newLawFirm) => {
      // Invalidate and refetch law firms list
      queryClient.invalidateQueries({ queryKey: lawFirmKeys.lists() });

      // Add to cache
      queryClient.setQueryData(lawFirmKeys.detail(newLawFirm.id), newLawFirm);

      toast.success("Law firm created successfully");
    },
    onError: (error: Error) => {
      console.error("Create law firm error:", error);
      toast.error(error.message || "Failed to create law firm");
    },
  });
}

// Update Law Firm Mutation
export function useUpdateLawFirm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: LawFirmUpdate }) =>
      lawFirmService.updateLawFirm(id, updates),
    onSuccess: (updatedLawFirm, { id }) => {
      // Update specific law firm in cache
      queryClient.setQueryData(lawFirmKeys.detail(id), updatedLawFirm);

      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: lawFirmKeys.lists() });

      toast.success("Law firm updated successfully");
    },
    onError: (error: Error) => {
      console.error("Update law firm error:", error);
      toast.error(error.message || "Failed to update law firm");
    },
  });
}

// Delete Law Firm Mutation
export function useDeleteLawFirm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => lawFirmService.deleteLawFirm(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: lawFirmKeys.detail(deletedId) });

      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: lawFirmKeys.lists() });

      toast.success("Law firm deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Delete law firm error:", error);
      toast.error(error.message || "Failed to delete law firm");
    },
  });
}

// Generate Referral Code Mutation
export function useGenerateReferralCode() {
  return useMutation({
    mutationFn: (lawFirmName: string) =>
      lawFirmService.generateReferralCode(lawFirmName),
    onError: (error: Error) => {
      console.error("Generate referral code error:", error);
      toast.error("Failed to generate referral code");
    },
  });
}

// Check Referral Code Availability
export function useCheckReferralCode() {
  return useMutation({
    mutationFn: (referralCode: string) =>
      lawFirmService.checkReferralCodeAvailability(referralCode),
    onError: (error: Error) => {
      console.error("Check referral code error:", error);
    },
  });
}
