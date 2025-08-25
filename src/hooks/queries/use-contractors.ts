"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  contractorService,
  ContractorListData,
} from "@/services/contractor-service";
import { Contractor, ContractorFormData, ContractorUpdateData } from "@/types";

// Query Keys
export const contractorKeys = {
  all: ["contractors"] as const,
  lists: () => [...contractorKeys.all, "list"] as const,
  list: (filters?: { page?: number; limit?: number; search?: string }) =>
    [...contractorKeys.lists(), filters || {}] as const,
  details: () => [...contractorKeys.all, "detail"] as const,
  detail: (id: string) => [...contractorKeys.details(), id] as const,
  stats: (id: string) => [...contractorKeys.all, "stats", id] as const,
};

// Query Hooks
export function useContractors(filters?: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: contractorKeys.list(filters),
    queryFn: async () => {
      const result = await contractorService.getContractors(
        filters?.page,
        filters?.limit,
        filters?.search
      );
      if (result.error) {
        throw result.error;
      }
      return result.data as ContractorListData;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useContractor(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: contractorKeys.detail(id),
    queryFn: async () => {
      const result = await contractorService.getContractor(id);
      if (result.error) {
        throw result.error;
      }
      return result.data as Contractor;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useContractorStats(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: contractorKeys.stats(id),
    queryFn: async () => {
      const result = await contractorService.getContractorStats(id);
      if (result.error) {
        throw result.error;
      }
      return result.data;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation Hooks
export function useCreateContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractorData: ContractorFormData) => {
      const result = await contractorService.createContractor(contractorData);
      if (result.error) {
        throw result.error;
      }
      return result.data as Contractor;
    },
    onSuccess: () => {
      // Invalidate contractors list to refetch with new data
      queryClient.invalidateQueries({ queryKey: contractorKeys.lists() });
      // Invalidate admin stats if they exist
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useUpdateContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      id: string;
      data: ContractorUpdateData;
    }) => {
      const result = await contractorService.updateContractor(
        variables.id,
        variables.data
      );
      if (result.error) {
        throw result.error;
      }
      return result.data as Contractor;
    },
    onSuccess: (data, variables) => {
      // Update the specific contractor in cache
      queryClient.setQueryData(contractorKeys.detail(variables.id), data);
      // Invalidate contractors list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: contractorKeys.lists() });
    },
  });
}

export function useDeleteContractor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await contractorService.deleteContractor(id);
      if (result.error) {
        throw result.error;
      }
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove the contractor from cache
      queryClient.removeQueries({ queryKey: contractorKeys.detail(deletedId) });
      // Invalidate contractors list to refetch without deleted contractor
      queryClient.invalidateQueries({ queryKey: contractorKeys.lists() });
      // Invalidate admin stats if they exist
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}
