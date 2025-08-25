"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TenantFormData } from "@/types";

const tenantKeys = {
  all: ["tenants"] as const,
  lists: () => [...tenantKeys.all, "list"] as const,
  list: (landlordId: string) => [...tenantKeys.lists(), landlordId] as const,
  detail: (tenantId: string) =>
    [...tenantKeys.all, "detail", tenantId] as const,
  byProperty: (propertyId: string) =>
    [...tenantKeys.all, "property", propertyId] as const,
};

// Tenant service functions
const tenantService = {
  async getTenants(landlordId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tenants")
      .select(
        `
        *,
        property:properties(*),
        landlord:profiles!tenants_landlord_id_fkey(*)
      `
      )
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTenantsByProperty(propertyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tenants")
      .select(
        `
        *,
        property:properties(*),
        landlord:profiles!tenants_landlord_id_fkey(*)
      `
      )
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTenant(tenantId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tenants")
      .select(
        `
        *,
        property:properties(*),
        landlord:profiles!tenants_landlord_id_fkey(*)
      `
      )
      .eq("id", tenantId)
      .single();

    if (error) throw error;
    return data;
  },

  async createTenant(landlordId: string, tenantData: TenantFormData) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tenants")
      .insert({
        landlord_id: landlordId,
        ...tenantData,
      })
      .select(
        `
        *,
        property:properties(*),
        landlord:profiles!tenants_landlord_id_fkey(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async updateTenant(tenantId: string, updates: Partial<TenantFormData>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("tenants")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", tenantId)
      .select(
        `
        *,
        property:properties(*),
        landlord:profiles!tenants_landlord_id_fkey(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTenant(tenantId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("tenants")
      .delete()
      .eq("id", tenantId);

    if (error) throw error;
  },
};

// Query hooks
export function useTenants(landlordId?: string) {
  return useQuery({
    queryKey: tenantKeys.list(landlordId!),
    queryFn: () => tenantService.getTenants(landlordId!),
    enabled: !!landlordId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTenantsByProperty(propertyId?: string) {
  return useQuery({
    queryKey: tenantKeys.byProperty(propertyId!),
    queryFn: () => tenantService.getTenantsByProperty(propertyId!),
    enabled: !!propertyId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useTenant(tenantId?: string) {
  return useQuery({
    queryKey: tenantKeys.detail(tenantId!),
    queryFn: () => tenantService.getTenant(tenantId!),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hooks
export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      landlordId: string;
      tenantData: TenantFormData;
    }) =>
      tenantService.createTenant(variables.landlordId, variables.tenantData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch tenants list
      queryClient.invalidateQueries({
        queryKey: tenantKeys.list(variables.landlordId),
      });
      // Also invalidate tenants by property if property_id is available
      if (data.property_id) {
        queryClient.invalidateQueries({
          queryKey: tenantKeys.byProperty(data.property_id),
        });
      }
      // Invalidate all lists to be safe
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      tenantId: string;
      updates: Partial<TenantFormData>;
    }) => tenantService.updateTenant(variables.tenantId, variables.updates),
    onSuccess: (data, variables) => {
      // Update the specific tenant in cache
      queryClient.setQueryData(tenantKeys.detail(variables.tenantId), data);
      // Invalidate lists to refetch updated data
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      // Invalidate property-specific tenant list if property_id is available
      if (data.property_id) {
        queryClient.invalidateQueries({
          queryKey: tenantKeys.byProperty(data.property_id),
        });
      }
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tenantId: string) => tenantService.deleteTenant(tenantId),
    onSuccess: (_, tenantId) => {
      // Remove the tenant from cache
      queryClient.removeQueries({ queryKey: tenantKeys.detail(tenantId) });
      // Invalidate lists to refetch without deleted tenant
      queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
      // Invalidate all property-based lists
      queryClient.invalidateQueries({
        queryKey: [...tenantKeys.all, "property"],
        exact: false,
      });
      // Invalidate tenant-property combined lists
      queryClient.invalidateQueries({
        queryKey: ["tenant-properties"],
        exact: false,
      });
    },
  });
}
