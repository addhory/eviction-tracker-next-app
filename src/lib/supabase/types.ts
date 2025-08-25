// =============================================================================
// SHARED SUPABASE TYPES AND UTILITIES (DRY Principle)
// =============================================================================
// Based on Supabase Context7 best practices

import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

// Type-safe Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>;

// Standard response type for all services
export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

// Pagination parameters (reusable)
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Standard list response (reusable)
export interface ListResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Query configuration (reusable)
export interface QueryConfig {
  staleTime?: number;
  enabled?: boolean;
  retryOnMount?: boolean;
}

// Mutation options (reusable)
export interface MutationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Role-based access check (DRY)
export type UserRole = "admin" | "landlord" | "contractor";

// Common query filters
export interface BaseFilters extends PaginationParams {
  status?: string;
  role?: UserRole;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// View names for consistent usage
export const VIEW_NAMES = {
  CONTRACTOR_AVAILABLE_JOBS: "contractor_available_jobs",
  CONTRACTOR_ASSIGNED_JOBS: "contractor_assigned_jobs",
} as const;

// Table names for consistent usage
export const TABLE_NAMES = {
  PROFILES: "profiles",
  PROPERTIES: "properties",
  TENANTS: "tenants",
  LEGAL_CASES: "legal_cases",
  LAW_FIRMS: "law_firms",
} as const;

// Status enums for consistency
export const CONTRACTOR_STATUS = {
  UNASSIGNED: "UNASSIGNED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export const CASE_STATUS = {
  NOTICE_DRAFT: "NOTICE_DRAFT",
  SUBMITTED: "SUBMITTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETE: "COMPLETE",
  CANCELLED: "CANCELLED",
} as const;

export const PAYMENT_STATUS = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  PARTIAL: "PARTIAL",
} as const;

// Reusable error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Validation error",
  NETWORK_ERROR: "Network error",
  UNKNOWN_ERROR: "Unknown error occurred",
} as const;
