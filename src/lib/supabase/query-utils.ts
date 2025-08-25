// =============================================================================
// SHARED QUERY UTILITIES (DRY Principle)
// =============================================================================
// Reusable utilities for Supabase queries following Context7 best practices

import { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import {
  PaginationParams,
  BaseFilters,
  ListResponse,
  ServiceResponse,
  ERROR_MESSAGES,
} from "./types";

// =============================================================================
// PAGINATION UTILITIES
// =============================================================================

/**
 * Apply pagination to a Supabase query
 * @param query - The Supabase query builder
 * @param page - Page number (1-based)
 * @param limit - Items per page
 */
export function applyPagination<T>(
  query: PostgrestFilterBuilder<any, any, any>,
  page: number = 1,
  limit: number = 10
) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
}

/**
 * Apply search filters to a query
 * @param query - The Supabase query builder
 * @param search - Search term
 * @param searchFields - Fields to search in
 */
export function applySearch<T>(
  query: PostgrestFilterBuilder<any, any, any>,
  search: string | undefined,
  searchFields: string[]
) {
  if (!search || searchFields.length === 0) return query;

  const searchQuery = searchFields
    .map((field) => `${field}.ilike.%${search}%`)
    .join(",");

  return query.or(searchQuery);
}

/**
 * Apply sorting to a query
 * @param query - The Supabase query builder
 * @param sortBy - Field to sort by
 * @param sortOrder - Sort order (asc/desc)
 */
export function applySorting<T>(
  query: PostgrestFilterBuilder<any, any, any>,
  sortBy: string = "created_at",
  sortOrder: "asc" | "desc" = "desc"
) {
  return query.order(sortBy, { ascending: sortOrder === "asc" });
}

/**
 * Create a standardized list response
 * @param data - Query result data
 * @param count - Total count from database
 * @param page - Current page
 * @param limit - Items per page
 */
export function createListResponse<T>(
  data: T[] | null,
  count: number | null,
  page: number,
  limit: number
): ListResponse<T> {
  const items = data || [];
  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  return {
    items,
    totalCount,
    page,
    limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

/**
 * Standardized error handling for service responses
 * @param error - The error object
 * @param context - Additional context for the error
 */
export function handleServiceError(error: unknown, context?: string): Error {
  console.error(`Service Error${context ? ` (${context})` : ""}:`, error);

  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  return new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
}

/**
 * Create a successful service response
 * @param data - The response data
 */
export function createSuccessResponse<T>(data: T): ServiceResponse<T> {
  return { data, error: null };
}

/**
 * Create an error service response
 * @param error - The error
 */
export function createErrorResponse<T>(error: Error): ServiceResponse<T> {
  return { data: null, error };
}

// =============================================================================
// ROLE CHECKING UTILITIES
// =============================================================================

/**
 * Check if current user has admin role (direct query - no RPC)
 * @param supabase - Supabase client instance
 */
export async function checkAdminRole(supabase: any): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role === "admin";
  } catch (error) {
    console.error("Error checking admin role:", error);
    return false;
  }
}

/**
 * Check if current user has contractor role
 * @param supabase - Supabase client instance
 */
export async function checkContractorRole(supabase: any): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return profile?.role === "contractor";
  } catch (error) {
    console.error("Error checking contractor role:", error);
    return false;
  }
}

/**
 * Get current user's profile with role
 * @param supabase - Supabase client instance
 */
export async function getCurrentUserProfile(supabase: any) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return profile;
  } catch (error) {
    console.error("Error getting current user profile:", error);
    return null;
  }
}

// =============================================================================
// QUERY BUILDERS (DRY)
// =============================================================================

/**
 * Build a standardized list query with filters, pagination, and sorting
 * @param supabase - Supabase client
 * @param tableName - Table to query
 * @param filters - Query filters
 * @param selectFields - Fields to select
 * @param searchFields - Fields to search in
 */
export function buildListQuery(
  supabase: any,
  tableName: string,
  filters: BaseFilters = {},
  selectFields: string = "*",
  searchFields: string[] = []
) {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = "created_at",
    sortOrder = "desc",
  } = filters;

  let query = supabase.from(tableName).select(selectFields, { count: "exact" });

  // Apply search if provided
  if (search && searchFields.length > 0) {
    query = applySearch(query, search, searchFields);
  }

  // Apply pagination
  query = applyPagination(query, page, limit);

  // Apply sorting
  query = applySorting(query, sortBy, sortOrder);

  return query;
}

/**
 * Execute a list query and return standardized response
 * @param query - The built query
 * @param page - Current page
 * @param limit - Items per page
 */
export async function executeListQuery<T>(
  query: any,
  page: number = 1,
  limit: number = 10
): Promise<ServiceResponse<ListResponse<T>>> {
  try {
    const { data, error, count } = await query;

    if (error) throw error;

    const listResponse = createListResponse<T>(data, count, page, limit);
    return createSuccessResponse(listResponse);
  } catch (error) {
    return createErrorResponse(handleServiceError(error, "executeListQuery"));
  }
}
