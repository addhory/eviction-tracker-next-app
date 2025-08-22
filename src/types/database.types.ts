export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          name: string;
          role: "admin" | "landlord" | "contractor";
          phone: string | null;
          address: string | null;
          business_name: string | null;
          referral_code: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          price_overrides: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          name: string;
          role?: "admin" | "landlord" | "contractor";
          phone?: string | null;
          address?: string | null;
          business_name?: string | null;
          referral_code?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          price_overrides?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          name?: string;
          role?: "admin" | "landlord" | "contractor";
          phone?: string | null;
          address?: string | null;
          business_name?: string | null;
          referral_code?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          price_overrides?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      properties: {
        Row: {
          id: string;
          landlord_id: string;
          address: string;
          unit: string | null;
          city: string;
          state: string;
          zip_code: string;
          county: string;
          property_type: "RESIDENTIAL" | "COMMERCIAL";
          bedrooms: number | null;
          bathrooms: number | null;
          square_feet: number | null;
          year_built: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          address: string;
          unit?: string | null;
          city: string;
          state: string;
          zip_code: string;
          county: string;
          property_type: "RESIDENTIAL" | "COMMERCIAL";
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_feet?: number | null;
          year_built?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          landlord_id?: string;
          address?: string;
          unit?: string | null;
          city?: string;
          state?: string;
          zip_code?: string;
          county?: string;
          property_type?: "RESIDENTIAL" | "COMMERCIAL";
          bedrooms?: number | null;
          bathrooms?: number | null;
          square_feet?: number | null;
          year_built?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tenants: {
        Row: {
          id: string;
          landlord_id: string;
          property_id: string;
          tenant_names: string[];
          email: string | null;
          phone: string | null;
          lease_start_date: string | null;
          lease_end_date: string | null;
          rent_amount: number | null;
          is_subsidized: boolean | null;
          subsidy_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          property_id: string;
          tenant_names: string[];
          email?: string | null;
          phone?: string | null;
          lease_start_date?: string | null;
          lease_end_date?: string | null;
          rent_amount?: number | null;
          is_subsidized?: boolean | null;
          subsidy_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          landlord_id?: string;
          property_id?: string;
          tenant_names?: string[];
          email?: string | null;
          phone?: string | null;
          lease_start_date?: string | null;
          lease_end_date?: string | null;
          rent_amount?: number | null;
          is_subsidized?: boolean | null;
          subsidy_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      legal_cases: {
        Row: {
          id: string;
          landlord_id: string;
          property_id: string;
          tenant_id: string;
          case_type: "FTPR" | "HOLDOVER" | "OTHER";
          date_initiated: string;
          rent_owed_at_filing: number;
          current_rent_owed: number;
          status:
            | "NOTICE_DRAFT"
            | "SUBMITTED"
            | "IN_PROGRESS"
            | "COMPLETE"
            | "CANCELLED";
          payment_status: "UNPAID" | "PAID" | "PARTIAL";
          price: number;
          no_right_of_redemption: boolean | null;
          late_fees_charged: number | null;
          thirty_day_notice_file_name: string | null;
          payments_made: Json | null;
          notice_mailed_date: string | null;
          court_case_number: string | null;
          trial_date: string | null;
          court_hearing_date: string | null;
          court_outcome_notes: string | null;
          generated_documents: Json | null;
          district_court_case_number: string | null;
          warrant_order_date: string | null;
          initial_eviction_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          landlord_id: string;
          property_id: string;
          tenant_id: string;
          case_type: "FTPR" | "HOLDOVER" | "OTHER";
          date_initiated: string;
          rent_owed_at_filing?: number;
          current_rent_owed?: number;
          status:
            | "NOTICE_DRAFT"
            | "SUBMITTED"
            | "IN_PROGRESS"
            | "COMPLETE"
            | "CANCELLED";
          payment_status: "UNPAID" | "PAID" | "PARTIAL";
          price: number;
          no_right_of_redemption?: boolean | null;
          late_fees_charged?: number | null;
          thirty_day_notice_file_name?: string | null;
          payments_made?: Json | null;
          notice_mailed_date?: string | null;
          court_case_number?: string | null;
          trial_date?: string | null;
          court_hearing_date?: string | null;
          court_outcome_notes?: string | null;
          generated_documents?: Json | null;
          district_court_case_number?: string | null;
          warrant_order_date?: string | null;
          initial_eviction_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          landlord_id?: string;
          property_id?: string;
          tenant_id?: string;
          case_type?: "FTPR" | "HOLDOVER" | "OTHER";
          date_initiated?: string;
          rent_owed_at_filing?: number;
          current_rent_owed?: number;
          status?:
            | "NOTICE_DRAFT"
            | "SUBMITTED"
            | "IN_PROGRESS"
            | "COMPLETE"
            | "CANCELLED";
          payment_status?: "UNPAID" | "PAID" | "PARTIAL";
          price?: number;
          no_right_of_redemption?: boolean | null;
          late_fees_charged?: number | null;
          thirty_day_notice_file_name?: string | null;
          payments_made?: Json | null;
          notice_mailed_date?: string | null;
          court_case_number?: string | null;
          trial_date?: string | null;
          court_hearing_date?: string | null;
          court_outcome_notes?: string | null;
          generated_documents?: Json | null;
          district_court_case_number?: string | null;
          warrant_order_date?: string | null;
          initial_eviction_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      law_firms: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          city: string | null;
          state: string | null;
          zip_code: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          contact_person: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          contact_person?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          contact_person?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
