import { createClient } from "@/lib/supabase/client";
import { LegalCaseFormData, CaseStatus, PaymentStatus } from "@/types";
import { EmailService } from "./email-service";

export class LegalCaseService {
  private supabase = createClient();

  async getLegalCases(landlordId: string) {
    try {
      const { data, error } = await this.supabase
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getLegalCase(caseId: string) {
    try {
      const { data, error } = await this.supabase
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createLegalCase(landlordId: string, caseData: LegalCaseFormData) {
    try {
      const { data, error } = await this.supabase
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

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

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
    try {
      // Get the current case data before updating
      const { data: currentCase } = await this.supabase
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

      const { data, error } = await this.supabase
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

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async deleteLegalCase(caseId: string) {
    try {
      const { error } = await this.supabase
        .from("legal_cases")
        .delete()
        .eq("id", caseId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getCasesByStatus(landlordId: string, status: CaseStatus) {
    try {
      const { data, error } = await this.supabase
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getCasesByPaymentStatus(
    landlordId: string,
    paymentStatus: PaymentStatus
  ) {
    try {
      const { data, error } = await this.supabase
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
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
}
