// =============================================================================
// CONTRACTOR JOB SERVICE (DRY + Context7 Best Practices)
// =============================================================================

import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database.types";
import {
  TypedSupabaseClient,
  ServiceResponse,
  ListResponse,
  PaginationParams,
  VIEW_NAMES,
  TABLE_NAMES,
  CONTRACTOR_STATUS,
  CASE_STATUS,
  PAYMENT_STATUS,
} from "@/lib/supabase/types";
import {
  buildListQuery,
  executeListQuery,
  createSuccessResponse,
  createErrorResponse,
  handleServiceError,
  getCurrentUserProfile,
} from "@/lib/supabase/query-utils";
import {
  ContractorJob,
  ContractorJobStatus,
  DocumentType,
  JobDocument,
} from "@/types";

// =============================================================================
// BASE SERVICE CLASS (DRY)
// =============================================================================

abstract class BaseService {
  protected supabase: TypedSupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  protected async getCurrentUser() {
    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    return user;
  }

  protected async requireAuth() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Authentication required");
    return user;
  }

  protected transformError(error: unknown, context?: string): Error {
    return handleServiceError(error, context);
  }
}

// =============================================================================
// CONTRACTOR JOB SERVICE (Refactored)
// =============================================================================

export class ContractorJobService extends BaseService {
  // =============================================================================
  // JOB LISTING METHODS
  // =============================================================================

  /**
   * Get available jobs for contractors to claim
   * Uses the new contractor_available_jobs view
   */
  async getAvailableJobs(
    params: PaginationParams = {}
  ): Promise<ServiceResponse<ListResponse<ContractorJob>>> {
    try {
      await this.requireAuth();

      const searchFields = [
        "property_address",
        "property_city",
        "property_county",
        "landlord_name",
        "court_case_number",
      ];

      const query = buildListQuery(
        this.supabase,
        VIEW_NAMES.CONTRACTOR_AVAILABLE_JOBS,
        params,
        "*",
        searchFields
      );

      const result = await executeListQuery<Record<string, any>>(
        query,
        params.page,
        params.limit
      );

      if (result.error) return result as any;

      // Transform the data to ContractorJob format
      const transformedData: ListResponse<ContractorJob> = {
        ...result.data!,
        items: result.data!.items.map(this.transformToContractorJob),
      };

      return createSuccessResponse(transformedData);
    } catch (error) {
      return createErrorResponse(
        this.transformError(error, "getAvailableJobs")
      );
    }
  }

  /**
   * Get contractor's assigned jobs
   * Uses the new contractor_assigned_jobs view
   */
  async getMyJobs(
    params: PaginationParams & { status?: ContractorJobStatus } = {}
  ): Promise<ServiceResponse<ListResponse<ContractorJob>>> {
    try {
      const user = await this.requireAuth();

      let query = this.supabase
        .from(VIEW_NAMES.CONTRACTOR_ASSIGNED_JOBS)
        .select("*", { count: "exact" });

      // Filter by status if provided
      if (params.status) {
        query = query.eq("contractor_status", params.status);
      }

      // Apply pagination
      const { page = 1, limit = 10 } = params;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Apply sorting
      query = query.order("contractor_assigned_date", { ascending: false });

      const result = await executeListQuery<Record<string, any>>(
        query,
        page,
        limit
      );

      if (result.error) return result as any;

      // Transform the data
      const transformedData: ListResponse<ContractorJob> = {
        ...result.data!,
        items: result.data!.items.map(this.transformToContractorJob),
      };

      return createSuccessResponse(transformedData);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "getMyJobs"));
    }
  }

  // =============================================================================
  // JOB MANAGEMENT METHODS (Simplified - No RPC Functions)
  // =============================================================================

  /**
   * Claim a job using Supabase Edge Function (bypasses RLS)
   * Fixed: Uses Edge Function with service role to bypass RLS policies
   */
  async claimJob(caseId: string): Promise<ServiceResponse<boolean>> {
    try {
      const user = await this.requireAuth();

      // Call the claim-job Edge Function
      const { data, error } = await this.supabase.functions.invoke(
        "claim-job",
        {
          body: { caseId },
        }
      );

      if (error) {
        // Handle Edge Function errors
        throw new Error(error.message || "Failed to claim job");
      }

      if (!data) {
        throw new Error("No response from job claiming service");
      }

      // Check if the function returned an error
      if (data.error) {
        throw new Error(data.error);
      }

      return createSuccessResponse(true);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "claimJob"));
    }
  }

  /**
   * Unclaim a job using Supabase Edge Function (bypasses RLS)
   */
  async unclaimJob(caseId: string): Promise<ServiceResponse<boolean>> {
    try {
      const user = await this.requireAuth();

      // Call the unclaim-job Edge Function
      const { data, error } = await this.supabase.functions.invoke(
        "unclaim-job",
        {
          body: { caseId },
        }
      );

      if (error) {
        // Handle Edge Function errors
        throw new Error(error.message || "Failed to unclaim job");
      }

      if (!data) {
        throw new Error("No response from job unclaiming service");
      }

      // Check if the function returned an error
      if (data.error) {
        throw new Error(data.error);
      }

      return createSuccessResponse(true);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "unclaimJob"));
    }
  }

  /**
   * Update job status (direct database update)
   */
  async updateJobStatus(
    caseId: string,
    status: ContractorJobStatus,
    notes?: string
  ): Promise<ServiceResponse<boolean>> {
    try {
      const user = await this.requireAuth();

      const updateData: any = {
        contractor_status: status,
        contractor_notes: notes,
      };

      // Set completion date if completed
      if (status === CONTRACTOR_STATUS.COMPLETED) {
        updateData.contractor_completed_date = new Date().toISOString();
      }

      const { data, error } = await this.supabase
        .from(TABLE_NAMES.LEGAL_CASES)
        .update(updateData)
        .eq("id", caseId)
        .eq("contractor_id", user.id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Job not found or not assigned to you");
      }

      return createSuccessResponse(true);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "updateJobStatus"));
    }
  }

  // =============================================================================
  // DOCUMENT MANAGEMENT METHODS
  // =============================================================================

  /**
   * Upload document for a job
   */
  async uploadDocument(
    caseId: string,
    documentType: DocumentType,
    file: File
  ): Promise<ServiceResponse<JobDocument>> {
    try {
      const user = await this.requireAuth();

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${
        user.id
      }/${caseId}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await this.supabase.storage
        .from("contractor-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = this.supabase.storage
        .from("contractor-documents")
        .getPublicUrl(fileName);

      // Save document record
      const { data: docData, error: docError } = await this.supabase
        .from("contractor_job_documents")
        .insert({
          legal_case_id: caseId,
          contractor_id: user.id,
          document_type: documentType,
          file_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single();

      if (docError) throw docError;

      return createSuccessResponse(docData as JobDocument);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "uploadDocument"));
    }
  }

  /**
   * Get documents for a job
   */
  async getJobDocuments(
    caseId: string
  ): Promise<ServiceResponse<JobDocument[]>> {
    try {
      const user = await this.requireAuth();

      const { data, error } = await this.supabase
        .from("contractor_job_documents")
        .select("*")
        .eq("legal_case_id", caseId)
        .eq("contractor_id", user.id)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      return createSuccessResponse(data as JobDocument[]);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "getJobDocuments"));
    }
  }

  // =============================================================================
  // JOB DETAILS METHOD
  // =============================================================================

  /**
   * Get job details with related data
   */
  async getJobDetails(caseId: string): Promise<ServiceResponse<ContractorJob>> {
    try {
      await this.requireAuth();

      const { data, error } = await this.supabase
        .from(TABLE_NAMES.LEGAL_CASES)
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

      if (!data) {
        throw new Error("Job not found");
      }

      const job = this.transformToContractorJob(data);
      return createSuccessResponse(job);
    } catch (error) {
      return createErrorResponse(this.transformError(error, "getJobDetails"));
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Transform database row to ContractorJob (DRY)
   */
  private transformToContractorJob = (
    row: Record<string, any>
  ): ContractorJob => {
    return {
      id: row.id,
      case_id: row.id,
      case_number: row.court_case_number,
      district_court_case_number: row.district_court_case_number,
      due_date: row.initial_eviction_date || row.posting_due_date,
      client_name: row.landlord_name || row.landlord?.name,
      property_address: `${row.property_address || row.address}${
        row.property_unit || row.unit
          ? `, Unit ${row.property_unit || row.unit}`
          : ""
      }`,
      property_city: row.property_city || row.city,
      property_county: row.property_county || row.county,
      tenant_names: Array.isArray(row.tenant_names)
        ? row.tenant_names
        : typeof row.tenant_names === "string"
        ? row.tenant_names.split(", ")
        : [row.tenant_names].filter(Boolean),
      posting_instructions: row.posting_instructions,
      contractor_status: row.contractor_status || CONTRACTOR_STATUS.UNASSIGNED,
      assigned_at: row.contractor_assigned_date,
      landlord_contact: {
        name: row.landlord_name || row.landlord?.name,
        email: row.landlord_email || row.landlord?.email,
        phone: row.landlord_phone || row.landlord?.phone,
      },
    };
  };
}

// =============================================================================
// BACKWARD COMPATIBILITY (for existing code)
// =============================================================================

export interface ContractorJobListData {
  jobs: ContractorJob[];
  totalCount: number;
}

// =============================================================================
// SINGLETON EXPORT (DRY)
// =============================================================================

export const contractorJobService = new ContractorJobService();
