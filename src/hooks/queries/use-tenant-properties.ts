"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const tenantPropertyKeys = {
  all: ["tenant-properties"] as const,
  lists: () => [...tenantPropertyKeys.all, "list"] as const,
  list: (landlordId: string) =>
    [...tenantPropertyKeys.lists(), landlordId] as const,
};

// Types for the combined tenant-property data
export interface TenantProperty {
  id: string;
  tenantName: string;
  propertyAddress: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
  propertyType: "Residential" | "Commercial";
  evictionPostingInfo: string;
  // Additional fields from the database
  tenant_id?: string;
  property_id?: string;
  unit?: string;
  email?: string;
  phone?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  rent_amount?: number;
  is_subsidized?: boolean;
  subsidy_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  year_built?: number;
  created_at?: string;
  updated_at?: string;
}

// Service function to fetch tenant-property combinations
const tenantPropertyService = {
  async getTenantProperties(landlordId: string): Promise<TenantProperty[]> {
    const supabase = createClient();

    // First, get all properties for the landlord
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select("*")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (propertiesError) throw propertiesError;
    if (!properties) return [];

    // Get all tenants for this landlord
    const { data: tenants, error: tenantsError } = await supabase
      .from("tenants")
      .select("*")
      .eq("landlord_id", landlordId)
      .order("created_at", { ascending: false });

    if (tenantsError) throw tenantsError;

    // Combine the data
    const tenantProperties: TenantProperty[] = [];

    for (const property of properties) {
      // Find tenants for this property
      const propertyTenants =
        tenants?.filter((tenant) => tenant.property_id === property.id) || [];

      if (propertyTenants.length > 0) {
        // If there are tenants, create entries for each tenant
        for (const tenant of propertyTenants) {
          // Handle tenant_names from database (array of strings)
          const tenantNames = Array.isArray(tenant.tenant_names)
            ? tenant.tenant_names.join(", ")
            : tenant.tenant_names || "Unknown Tenant";

          tenantProperties.push({
            id: `${tenant.id}-${property.id}`, // Combined ID for unique identification
            tenant_id: tenant.id,
            property_id: property.id,
            tenantName: tenantNames,
            propertyAddress: property.address,
            unit: property.unit,
            city: property.city,
            state: property.state,
            zipCode: property.zip_code,
            county: property.county,
            propertyType:
              property.property_type === "RESIDENTIAL"
                ? "Residential"
                : "Commercial",
            evictionPostingInfo: `Property: ${property.address}${
              property.unit ? `, Unit ${property.unit}` : ""
            }`,
            email: tenant.email,
            phone: tenant.phone,
            lease_start_date: tenant.lease_start_date,
            lease_end_date: tenant.lease_end_date,
            rent_amount: tenant.rent_amount,
            is_subsidized: tenant.is_subsidized,
            subsidy_type: tenant.subsidy_type,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            square_feet: property.square_feet,
            year_built: property.year_built,
            created_at: tenant.created_at,
            updated_at: tenant.updated_at,
          });
        }
      } else {
        // If no tenants, create a property-only entry
        tenantProperties.push({
          id: `property-${property.id}`, // Property-only ID
          property_id: property.id,
          tenantName: "No Tenant Assigned",
          propertyAddress: property.address,
          unit: property.unit,
          city: property.city,
          state: property.state,
          zipCode: property.zip_code,
          county: property.county,
          propertyType:
            property.property_type === "RESIDENTIAL"
              ? "Residential"
              : "Commercial",
          evictionPostingInfo: `Property available: ${property.address}${
            property.unit ? `, Unit ${property.unit}` : ""
          }`,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          square_feet: property.square_feet,
          year_built: property.year_built,
          created_at: property.created_at,
          updated_at: property.updated_at,
        });
      }
    }

    return tenantProperties;
  },
};

// React Query hook for fetching tenant-property combinations
export function useTenantProperties(landlordId?: string) {
  return useQuery({
    queryKey: tenantPropertyKeys.list(landlordId || ""),
    queryFn: () => tenantPropertyService.getTenantProperties(landlordId!),
    enabled: !!landlordId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Export the query keys for use in other hooks
export { tenantPropertyKeys };
