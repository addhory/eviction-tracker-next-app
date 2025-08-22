import { createClient } from "@/lib/supabase/client";
import { PropertyFormData } from "@/types";

export class PropertyService {
  private supabase = createClient();

  async getProperties(landlordId: string) {
    try {
      const { data, error } = await this.supabase
        .from("properties")
        .select(
          `
          *,
          landlord:profiles(*)
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

  async getProperty(propertyId: string) {
    try {
      const { data, error } = await this.supabase
        .from("properties")
        .select(
          `
          *,
          landlord:profiles(*)
        `
        )
        .eq("id", propertyId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createProperty(landlordId: string, propertyData: PropertyFormData) {
    try {
      const { data, error } = await this.supabase
        .from("properties")
        .insert({
          landlord_id: landlordId,
          ...propertyData,
        })
        .select(
          `
          *,
          landlord:profiles(*)
        `
        )
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateProperty(propertyId: string, updates: Partial<PropertyFormData>) {
    try {
      const { data, error } = await this.supabase
        .from("properties")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", propertyId)
        .select(
          `
          *,
          landlord:profiles(*)
        `
        )
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async deleteProperty(propertyId: string) {
    try {
      const { error } = await this.supabase
        .from("properties")
        .delete()
        .eq("id", propertyId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getPropertiesByCounty(county: string) {
    try {
      const { data, error } = await this.supabase
        .from("properties")
        .select(
          `
          *,
          landlord:profiles(*)
        `
        )
        .eq("county", county)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
