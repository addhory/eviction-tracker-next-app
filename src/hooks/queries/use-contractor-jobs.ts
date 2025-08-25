// =============================================================================
// CONTRACTOR JOBS HOOKS (DRY + Context7 Best Practices)
// =============================================================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { contractorJobService } from "@/services/contractor-job-service";
import { ContractorJobStatus, DocumentType } from "@/types";
import { PaginationParams } from "@/lib/supabase/types";

// =============================================================================
// SHARED QUERY KEY FACTORY (DRY)
// =============================================================================

export const contractorJobKeys = {
  all: ["contractor-jobs"] as const,
  lists: () => [...contractorJobKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...contractorJobKeys.lists(), { filters }] as const,
  details: () => [...contractorJobKeys.all, "detail"] as const,
  detail: (id: string) => [...contractorJobKeys.details(), id] as const,
  documents: () => [...contractorJobKeys.all, "documents"] as const,
  jobDocuments: (caseId: string) =>
    [...contractorJobKeys.documents(), { caseId }] as const,
} as const;

// =============================================================================
// SHARED HOOK CONFIGURATION (DRY)
// =============================================================================

const DEFAULT_QUERY_CONFIG = {
  staleTime: 30 * 1000, // 30 seconds
  refetchOnWindowFocus: false,
} as const;

const MUTATION_CONFIG = {
  onError: (error: Error) => {
    console.error("Mutation error:", error);
    // You can add toast notifications here
  },
} as const;

// =============================================================================
// QUERY HOOKS (Simplified and DRY)
// =============================================================================

/**
 * Get available jobs for contractors to claim
 */
export function useAvailableJobs(
  params: PaginationParams = {
    page: 1,
    limit: 20,
    search: "",
  }
) {
  return useQuery({
    queryKey: contractorJobKeys.list({
      ...params,
      type: "available",
    }),
    queryFn: async () => {
      const result = await contractorJobService.getAvailableJobs(params);
      if (result.error) throw result.error;
      return result.data!;
    },
    ...DEFAULT_QUERY_CONFIG,
  });
}

/**
 * Get contractor's assigned jobs
 */
export function useMyJobs(
  params: PaginationParams & { status?: ContractorJobStatus } = {}
) {
  return useQuery({
    queryKey: contractorJobKeys.list({
      ...params,
      type: "my-jobs",
    }),
    queryFn: async () => {
      const result = await contractorJobService.getMyJobs(params);
      if (result.error) throw result.error;
      return result.data!;
    },
    ...DEFAULT_QUERY_CONFIG,
  });
}

/**
 * Get job details
 */
export function useJobDetails(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: contractorJobKeys.detail(caseId),
    queryFn: async () => {
      const result = await contractorJobService.getJobDetails(caseId);
      if (result.error) throw result.error;
      return result.data!;
    },
    enabled: enabled && !!caseId,
    ...DEFAULT_QUERY_CONFIG,
  });
}

/**
 * Get job documents
 */
export function useJobDocuments(caseId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: contractorJobKeys.jobDocuments(caseId),
    queryFn: async () => {
      const result = await contractorJobService.getJobDocuments(caseId);
      if (result.error) throw result.error;
      return result.data!;
    },
    enabled: enabled && !!caseId,
    ...DEFAULT_QUERY_CONFIG,
  });
}

// =============================================================================
// MUTATION HOOKS (Simplified and DRY)
// =============================================================================

/**
 * Claim a job mutation
 */
export function useClaimJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const result = await contractorJobService.claimJob(caseId);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      // Invalidate all job lists to refresh data
      queryClient.invalidateQueries({ queryKey: contractorJobKeys.lists() });
    },
    ...MUTATION_CONFIG,
  });
}

/**
 * Unclaim a job mutation
 */
export function useUnclaimJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (caseId: string) => {
      const result = await contractorJobService.unclaimJob(caseId);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractorJobKeys.lists() });
    },
    ...MUTATION_CONFIG,
  });
}

/**
 * Update job status mutation
 */
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      status,
      notes,
    }: {
      caseId: string;
      status: ContractorJobStatus;
      notes?: string;
    }) => {
      const result = await contractorJobService.updateJobStatus(
        caseId,
        status,
        notes
      );
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: contractorJobKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: contractorJobKeys.detail(variables.caseId),
      });
    },
    ...MUTATION_CONFIG,
  });
}

/**
 * Upload document mutation
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      caseId,
      documentType,
      file,
    }: {
      caseId: string;
      documentType: DocumentType;
      file: File;
    }) => {
      const result = await contractorJobService.uploadDocument(
        caseId,
        documentType,
        file
      );
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: (_, variables) => {
      // Invalidate documents for this job
      queryClient.invalidateQueries({
        queryKey: contractorJobKeys.jobDocuments(variables.caseId),
      });
    },
    ...MUTATION_CONFIG,
  });
}

// =============================================================================
// COMPOUND HOOKS (DRY - Combining Multiple Queries)
// =============================================================================

/**
 * Get all job-related data for a case
 */
export function useJobData(caseId: string, enabled: boolean = true) {
  const jobDetails = useJobDetails(caseId, enabled);
  const jobDocuments = useJobDocuments(caseId, enabled);

  return {
    job: jobDetails,
    documents: jobDocuments,
    isLoading: jobDetails.isLoading || jobDocuments.isLoading,
    isError: jobDetails.isError || jobDocuments.isError,
    error: jobDetails.error || jobDocuments.error,
  };
}

/**
 * Get dashboard data for contractors
 */
export function useContractorDashboard(params: PaginationParams = {}) {
  const availableJobs = useAvailableJobs(params);
  const myJobs = useMyJobs(params);

  return {
    available: availableJobs,
    assigned: myJobs,
    isLoading: availableJobs.isLoading || myJobs.isLoading,
    isError: availableJobs.isError || myJobs.isError,
    error: availableJobs.error || myJobs.error,
  };
}

// =============================================================================
// UTILITY HOOKS (DRY)
// =============================================================================

/**
 * Prefetch job details
 */
export function usePrefetchJobDetails() {
  const queryClient = useQueryClient();

  return (caseId: string) => {
    queryClient.prefetchQuery({
      queryKey: contractorJobKeys.detail(caseId),
      queryFn: async () => {
        const result = await contractorJobService.getJobDetails(caseId);
        if (result.error) throw result.error;
        return result.data!;
      },
      staleTime: DEFAULT_QUERY_CONFIG.staleTime,
    });
  };
}

/**
 * Invalidate all contractor job queries
 */
export function useInvalidateContractorJobs() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: contractorJobKeys.all });
  };
}
