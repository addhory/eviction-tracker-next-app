"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { PropertyFormData } from "@/types";

const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (landlordId: string) => [...propertyKeys.lists(), landlordId] as const,
  detail: (propertyId: string) =>
    [...propertyKeys.all, "detail", propertyId] as const,
  byCounty: (county: string) =>
    [...propertyKeys.all, "county", county] as const,
};

// Property service functions
const propertyService = {
  async getProperties(landlordId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .select(
        `
        *,
        landlord:profiles!properties_landlord_id_fkey(*)
      `
      )
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getProperty(propertyId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .select(
        `
        *,
        landlord:profiles!properties_landlord_id_fkey(*)
      `
      )
      .eq("id", propertyId)
      .single();

    if (error) throw error;
    return data;
  },

  async createProperty(landlordId: string, propertyData: PropertyFormData) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .insert({
        landlord_id: landlordId,
        ...propertyData,
      })
      .select(
        `
        *,
        landlord:profiles!properties_landlord_id_fkey(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async updateProperty(propertyId: string, updates: Partial<PropertyFormData>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", propertyId)
      .select(
        `
        *,
        landlord:profiles!properties_landlord_id_fkey(*)
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProperty(propertyId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (error) throw error;
  },

  async getPropertiesByCounty(county: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .select(
        `
        *,
        landlord:profiles!properties_landlord_id_fkey(*)
      `
      )
      .eq("county", county)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Query hooks
export function useProperties(landlordId?: string) {
  return useQuery({
    queryKey: propertyKeys.list(landlordId!),
    queryFn: () => propertyService.getProperties(landlordId!),
    enabled: !!landlordId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProperty(propertyId?: string) {
  return useQuery({
    queryKey: propertyKeys.detail(propertyId!),
    queryFn: () => propertyService.getProperty(propertyId!),
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePropertiesByCounty(county?: string) {
  return useQuery({
    queryKey: propertyKeys.byCounty(county!),
    queryFn: () => propertyService.getPropertiesByCounty(county!),
    enabled: !!county,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hooks
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      landlordId: string;
      propertyData: PropertyFormData;
    }) =>
      propertyService.createProperty(
        variables.landlordId,
        variables.propertyData
      ),
    onSuccess: (data, variables) => {
      // Invalidate and refetch properties list
      queryClient.invalidateQueries({
        queryKey: propertyKeys.list(variables.landlordId),
      });
      // Also invalidate the "all properties" list to be safe
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      propertyId: string;
      updates: Partial<PropertyFormData>;
    }) =>
      propertyService.updateProperty(variables.propertyId, variables.updates),
    onSuccess: (data, variables) => {
      // Update the specific property in cache
      queryClient.setQueryData(propertyKeys.detail(variables.propertyId), data);
      // Invalidate lists to refetch updated data
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) =>
      propertyService.deleteProperty(propertyId),
    onSuccess: (_, propertyId) => {
      // Remove the property from cache
      queryClient.removeQueries({ queryKey: propertyKeys.detail(propertyId) });
      // Invalidate lists to refetch without deleted property
      queryClient.invalidateQueries({ queryKey: propertyKeys.lists() });
    },
  });
}
