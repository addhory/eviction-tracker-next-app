import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";

export type LawFirm = Database["public"]["Tables"]["law_firms"]["Row"];
export type LawFirmInsert = Database["public"]["Tables"]["law_firms"]["Insert"];
export type LawFirmUpdate = Database["public"]["Tables"]["law_firms"]["Update"];

export interface LawFirmFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface LawFirmResponse {
  lawFirms: LawFirm[];
  totalCount: number;
}

export class LawFirmService {
  private supabase = createClient();

  async getLawFirms(filters?: LawFirmFilters): Promise<LawFirmResponse> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from("law_firms")
      .select("*", { count: "exact" });

    // Apply search filter if provided
    if (filters?.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    // Apply pagination and ordering
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return {
      lawFirms: data || [],
      totalCount: count || 0,
    };
  }

  async getLawFirm(id: string): Promise<LawFirm> {
    const { data, error } = await this.supabase
      .from("law_firms")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Law firm not found");

    return data;
  }

  async createLawFirm(lawFirmData: LawFirmInsert): Promise<LawFirm> {
    const { data, error } = await this.supabase
      .from("law_firms")
      .insert({
        ...lawFirmData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to create law firm");

    return data;
  }

  async updateLawFirm(id: string, updates: LawFirmUpdate): Promise<LawFirm> {
    const { data, error } = await this.supabase
      .from("law_firms")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to update law firm");

    return data;
  }

  async deleteLawFirm(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("law_firms")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  }

  async generateReferralCode(lawFirmName: string): Promise<string> {
    // Generate a simple referral code based on law firm name
    const baseCode = lawFirmName
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .substring(0, 5);
    
    const randomNumber = Math.floor(Math.random() * 999) + 1;
    return `${baseCode}${randomNumber}`;
  }

  async checkReferralCodeAvailability(referralCode: string): Promise<boolean> {
    // Check if referral code is already in use (you might want to store this in a separate table)
    // For now, we'll just check against existing law firm names patterns
    const { data, error } = await this.supabase
      .from("law_firms")
      .select("id")
      .ilike("name", `%${referralCode}%`)
      .limit(1);

    if (error) return false;
    return !data || data.length === 0;
  }
}

// Export singleton instance
export const lawFirmService = new LawFirmService();
