import { createClient } from "@/lib/supabase/client";
import { TenantFormData } from "@/types";

export class TenantService {
  private supabase = createClient();

  async getTenants(landlordId: string) {
    try {
      const { data, error } = await this.supabase
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getTenantsByProperty(propertyId: string) {
    try {
      const { data, error } = await this.supabase
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getTenant(tenantId: string) {
    try {
      const { data, error } = await this.supabase
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createTenant(landlordId: string, tenantData: TenantFormData) {
    try {
      const { data, error } = await this.supabase
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateTenant(tenantId: string, updates: Partial<TenantFormData>) {
    try {
      const { data, error } = await this.supabase
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async deleteTenant(tenantId: string) {
    try {
      const { error } = await this.supabase
        .from("tenants")
        .delete()
        .eq("id", tenantId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
}
