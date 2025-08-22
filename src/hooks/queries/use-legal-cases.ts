"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { LegalCaseFormData, CaseStatus, PaymentStatus } from "@/types";
import { EmailService } from "@/services/email-service";

const legalCaseKeys = {
  all: ["legalCases"] as const,
  lists: () => [...legalCaseKeys.all, "list"] as const,
  list: (landlordId: string) => [...legalCaseKeys.lists(), landlordId] as const,
  detail: (caseId: string) => [...legalCaseKeys.all, "detail", caseId] as const,
  byStatus: (landlordId: string, status: CaseStatus) =>
    [...legalCaseKeys.all, "status", landlordId, status] as const,
  byPaymentStatus: (landlordId: string, paymentStatus: PaymentStatus) =>
    [...legalCaseKeys.all, "paymentStatus", landlordId, paymentStatus] as const,
};

// Legal case service functions
const legalCaseService = {
  async getLegalCases(landlordId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("legal_cases")
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles(*)
      `
      )
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getLegalCase(caseId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("legal_cases")
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles(*)
      `
      )
      .eq("id", caseId)
      .single();

    if (error) throw error;
    return data;
  },

  async createLegalCase(landlordId: string, caseData: LegalCaseFormData) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("legal_cases")
      .insert({
        landlord_id: landlordId,
        status: "NOTICE_DRAFT" as CaseStatus,
        payment_status: "UNPAID" as PaymentStatus,
        ...caseData,
      })
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles(*)
      `
      )
      .single();

    if (error) throw error;

    // Send email notification for case creation
    if (data && data.property && data.tenant && data.landlord) {
      try {
        await EmailService.sendCaseCreatedNotification(
          data,
          data.property,
          data.tenant,
          data.landlord
        );
      } catch (emailError) {
        // Log email error but don't fail the case creation
        console.error("Failed to send case creation email:", emailError);
      }
    }

    return data;
  },

  async updateLegalCase(
    caseId: string,
    updates: Partial<
      LegalCaseFormData & {
        status?: CaseStatus;
        payment_status?: PaymentStatus;
        court_case_number?: string;
        trial_date?: string;
        court_hearing_date?: string;
        court_outcome_notes?: string;
        notice_mailed_date?: string;
        warrant_order_date?: string;
        initial_eviction_date?: string;
        thirty_day_notice_file_name?: string;
        generated_documents?: Record<string, unknown>;
        payments_made?: Record<string, unknown>[];
      }
    >
  ) {
    const supabase = createClient();

    // Get the current case data before updating
    const { data: currentCase } = await supabase
      .from("legal_cases")
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles(*)
      `
      )
      .eq("id", caseId)
      .single();

    const { data, error } = await supabase
      .from("legal_cases")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", caseId)
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles(*)
      `
      )
      .single();

    if (error) throw error;

    // Send email notification for status changes
    if (
      data &&
      data.property &&
      data.tenant &&
      data.landlord &&
      currentCase &&
      updates.status &&
      updates.status !== currentCase.status
    ) {
      try {
        await EmailService.sendCaseStatusUpdateNotification(
          data,
          data.property,
          data.tenant,
          data.landlord,
          currentCase.status,
          updates.status
        );
      } catch (emailError) {
        // Log email error but don't fail the update
        console.error("Failed to send status update email:", emailError);
      }
    }

    return data;
  },

  async deleteLegalCase(caseId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("legal_cases")
      .delete()
      .eq("id", caseId);

    if (error) throw error;
  },

  async getCasesByStatus(landlordId: string, status: CaseStatus) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("legal_cases")
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles(*)
      `
      )
      .eq("landlord_id", landlordId)
      .eq("status", status)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getCasesByPaymentStatus(
    landlordId: string,
    paymentStatus: PaymentStatus
  ) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("legal_cases")
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles(*)
      `
      )
      .eq("landlord_id", landlordId)
      .eq("payment_status", paymentStatus)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Query hooks
export function useLegalCases(landlordId?: string) {
  return useQuery({
    queryKey: legalCaseKeys.list(landlordId!),
    queryFn: () => legalCaseService.getLegalCases(landlordId!),
    enabled: !!landlordId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useLegalCase(caseId?: string) {
  return useQuery({
    queryKey: legalCaseKeys.detail(caseId!),
    queryFn: () => legalCaseService.getLegalCase(caseId!),
    enabled: !!caseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCasesByStatus(landlordId?: string, status?: CaseStatus) {
  return useQuery({
    queryKey: legalCaseKeys.byStatus(landlordId!, status!),
    queryFn: () => legalCaseService.getCasesByStatus(landlordId!, status!),
    enabled: !!landlordId && !!status,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCasesByPaymentStatus(
  landlordId?: string,
  paymentStatus?: PaymentStatus
) {
  return useQuery({
    queryKey: legalCaseKeys.byPaymentStatus(landlordId!, paymentStatus!),
    queryFn: () =>
      legalCaseService.getCasesByPaymentStatus(landlordId!, paymentStatus!),
    enabled: !!landlordId && !!paymentStatus,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Mutation hooks
export function useCreateLegalCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      landlordId: string;
      caseData: LegalCaseFormData;
    }) =>
      legalCaseService.createLegalCase(
        variables.landlordId,
        variables.caseData
      ),
    onSuccess: (data, variables) => {
      // Invalidate and refetch legal cases list
      queryClient.invalidateQueries({
        queryKey: legalCaseKeys.list(variables.landlordId),
      });
      // Invalidate status-based queries
      queryClient.invalidateQueries({
        queryKey: [...legalCaseKeys.all, "status", variables.landlordId],
        exact: false,
      });
      // Invalidate payment status-based queries
      queryClient.invalidateQueries({
        queryKey: [...legalCaseKeys.all, "paymentStatus", variables.landlordId],
        exact: false,
      });
      // Invalidate all lists to be safe
      queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
    },
  });
}

export function useUpdateLegalCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      caseId: string;
      updates: Partial<
        LegalCaseFormData & {
          status?: CaseStatus;
          payment_status?: PaymentStatus;
          court_case_number?: string;
          trial_date?: string;
          court_hearing_date?: string;
          court_outcome_notes?: string;
          notice_mailed_date?: string;
          warrant_order_date?: string;
          initial_eviction_date?: string;
          thirty_day_notice_file_name?: string;
          generated_documents?: Record<string, unknown>;
          payments_made?: Record<string, unknown>[];
        }
      >;
    }) => legalCaseService.updateLegalCase(variables.caseId, variables.updates),
    onSuccess: (data, variables) => {
      // Update the specific case in cache
      queryClient.setQueryData(legalCaseKeys.detail(variables.caseId), data);
      // Invalidate lists to refetch updated data
      queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
      // Invalidate status-based queries since status might have changed
      queryClient.invalidateQueries({
        queryKey: [...legalCaseKeys.all, "status"],
        exact: false,
      });
      // Invalidate payment status-based queries since payment status might have changed
      queryClient.invalidateQueries({
        queryKey: [...legalCaseKeys.all, "paymentStatus"],
        exact: false,
      });
    },
  });
}

export function useDeleteLegalCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseId: string) => legalCaseService.deleteLegalCase(caseId),
    onSuccess: (_, caseId) => {
      // Remove the case from cache
      queryClient.removeQueries({ queryKey: legalCaseKeys.detail(caseId) });
      // Invalidate lists to refetch without deleted case
      queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
      // Invalidate status and payment status queries
      queryClient.invalidateQueries({
        queryKey: [...legalCaseKeys.all, "status"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: [...legalCaseKeys.all, "paymentStatus"],
        exact: false,
      });
    },
  });
}
