"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const legalCaseKeys = {
  all: ["legal-cases"] as const,
  lists: () => [...legalCaseKeys.all, "list"] as const,
  list: (landlordId: string) => [...legalCaseKeys.lists(), landlordId] as const,
  detail: (caseId: string) => [...legalCaseKeys.all, "detail", caseId] as const,
  byProperty: (propertyId: string) =>
    [...legalCaseKeys.all, "property", propertyId] as const,
  byTenant: (tenantId: string) =>
    [...legalCaseKeys.all, "tenant", tenantId] as const,
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
        landlord:profiles!legal_cases_landlord_id_fkey(*)
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
        landlord:profiles!legal_cases_landlord_id_fkey(*)
      `
      )
      .eq("id", caseId)
      .single();

    if (error) throw error;
    return data;
  },

  async getLegalCasesByProperty(propertyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("legal_cases")
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles!legal_cases_landlord_id_fkey(*)
      `
      )
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getLegalCasesByTenant(tenantId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("legal_cases")
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles!legal_cases_landlord_id_fkey(*)
      `
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async createLegalCase(
    landlordId: string,
    data: {
      tenant_id: string;
      property_id: string;
      case_type: "FTPR" | "HOLDOVER" | "OTHER";
      date_initiated: string;
      current_rent_owed: number;
      price: number;
      no_right_of_redemption: boolean;
      district_court_case_number: string;
      warrant_order_date: string;
      initial_eviction_date: string;
      signature_name?: string;
    }
  ) {
    const supabase = createClient();

    // Format the data for insertion
    const insertData = {
      landlord_id: landlordId,
      property_id: data.property_id,
      tenant_id: data.tenant_id,
      case_type: "FTPR" as const, // Default case type for eviction letters
      date_initiated: data.date_initiated,
      rent_owed_at_filing: data.current_rent_owed,
      current_rent_owed: data.current_rent_owed,
      status: "NOTICE_DRAFT" as const, // Initial status
      payment_status: "UNPAID" as const, // Initial payment status
      price: data.price,
      no_right_of_redemption: data.no_right_of_redemption,
      district_court_case_number: data.district_court_case_number,
      warrant_order_date: data.warrant_order_date,
      initial_eviction_date: data.initial_eviction_date,
      generated_documents: {
        signature_name: data.signature_name,
      },
    };

    const { data: result, error } = await supabase
      .from("legal_cases")
      .insert(insertData)
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles!legal_cases_landlord_id_fkey(*)
      `
      )
      .single();

    if (error) throw error;
    return result;
  },

  async updateLegalCase(
    caseId: string,
    updates: Partial<{
      status:
        | "NOTICE_DRAFT"
        | "SUBMITTED"
        | "IN_PROGRESS"
        | "COMPLETE"
        | "CANCELLED";
      payment_status: "UNPAID" | "PAID" | "PARTIAL";
      current_rent_owed: number;
      court_case_number: string;
      trial_date: string;
      court_hearing_date: string;
      court_outcome_notes: string;
      generated_documents: Record<string, any>;
    }>
  ) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("legal_cases")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", caseId)
      .select(
        `
        *,
        property:properties(*),
        tenant:tenants(*),
        landlord:profiles!legal_cases_landlord_id_fkey(*)
      `
      )
      .single();

    if (error) throw error;
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

export function useLegalCasesByProperty(propertyId?: string) {
  return useQuery({
    queryKey: legalCaseKeys.byProperty(propertyId!),
    queryFn: () => legalCaseService.getLegalCasesByProperty(propertyId!),
    enabled: !!propertyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useLegalCasesByTenant(tenantId?: string) {
  return useQuery({
    queryKey: legalCaseKeys.byTenant(tenantId!),
    queryFn: () => legalCaseService.getLegalCasesByTenant(tenantId!),
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Mutation hooks
export function useCreateLegalCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      landlordId: string;
      data: {
        tenant_id: string;
        property_id: string;
        case_type: "FTPR" | "HOLDOVER" | "OTHER";
        date_initiated: string;
        current_rent_owed: number;
        price: number;
        no_right_of_redemption: boolean;
        district_court_case_number: string;
        warrant_order_date: string;
        initial_eviction_date: string;
        signature_name?: string;
      };
    }) =>
      legalCaseService.createLegalCase(variables.landlordId, variables.data),
    onSuccess: (data, variables) => {
      // Invalidate and refetch legal cases list
      queryClient.invalidateQueries({
        queryKey: legalCaseKeys.list(variables.landlordId),
      });
      // Also invalidate cases by property if property_id is available
      if (data.property_id) {
        queryClient.invalidateQueries({
          queryKey: legalCaseKeys.byProperty(data.property_id),
        });
      }
      // Invalidate cases by tenant if tenant_id is available
      if (data.tenant_id) {
        queryClient.invalidateQueries({
          queryKey: legalCaseKeys.byTenant(data.tenant_id),
        });
      }
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
      updates: Partial<{
        status:
          | "NOTICE_DRAFT"
          | "SUBMITTED"
          | "IN_PROGRESS"
          | "COMPLETE"
          | "CANCELLED";
        payment_status: "UNPAID" | "PAID" | "PARTIAL";
        current_rent_owed: number;
        court_case_number: string;
        trial_date: string;
        court_hearing_date: string;
        court_outcome_notes: string;
        generated_documents: Record<string, any>;
      }>;
    }) => legalCaseService.updateLegalCase(variables.caseId, variables.updates),
    onSuccess: (data, variables) => {
      // Update the specific case in cache
      queryClient.setQueryData(legalCaseKeys.detail(variables.caseId), data);
      // Invalidate lists to refetch updated data
      queryClient.invalidateQueries({ queryKey: legalCaseKeys.lists() });
      // Invalidate property-specific and tenant-specific case lists
      if (data.property_id) {
        queryClient.invalidateQueries({
          queryKey: legalCaseKeys.byProperty(data.property_id),
        });
      }
      if (data.tenant_id) {
        queryClient.invalidateQueries({
          queryKey: legalCaseKeys.byTenant(data.tenant_id),
        });
      }
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
      // Invalidate all property and tenant-based lists
      queryClient.invalidateQueries({
        queryKey: [...legalCaseKeys.all, "property"],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: [...legalCaseKeys.all, "tenant"],
        exact: false,
      });
    },
  });
}
