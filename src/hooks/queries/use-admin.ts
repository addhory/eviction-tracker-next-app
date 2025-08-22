"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

// Types from the original admin service
export interface AdminStats {
  totalUsers: number;
  totalLandlords: number;
  totalContractors: number;
  totalProperties: number;
  totalTenants: number;
  totalCases: number;
  activeCases: number;
  completedCases: number;
  totalRevenue: number;
  pendingPayments: number;
  casesByStatus: Record<string, number>;
  casesByCounty: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: "case_created" | "case_updated" | "user_registered";
    description: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
}

export interface UserManagementData {
  users: Array<{
    id: string;
    username: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    last_activity?: string;
  }>;
  totalCount: number;
}

const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
  users: () => [...adminKeys.all, "users"] as const,
  usersList: (filters?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => [...adminKeys.users(), filters || {}] as const,
  reports: () => [...adminKeys.all, "reports"] as const,
  systemHealth: () => [...adminKeys.all, "systemHealth"] as const,
};

// Admin service functions
const adminService = {
  async getDashboardStats(): Promise<AdminStats> {
    const supabase = createClient();

    // Get user counts
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("role, created_at");

    if (profilesError) throw profilesError;

    const totalUsers = profiles?.length || 0;
    const totalLandlords =
      profiles?.filter((p) => p.role === "landlord").length || 0;
    const totalContractors =
      profiles?.filter((p) => p.role === "contractor").length || 0;

    // Get property count
    const { count: totalProperties } = await supabase
      .from("properties")
      .select("*", { count: "exact", head: true });

    // Get tenant count
    const { count: totalTenants } = await supabase
      .from("tenants")
      .select("*", { count: "exact", head: true });

    // Get case statistics
    const { data: cases, error: casesError } = await supabase
      .from("legal_cases")
      .select("status, payment_status, price, created_at, properties(county)");

    if (casesError) throw casesError;

    const totalCases = cases?.length || 0;
    const activeCases =
      cases?.filter(
        (c) => c.status === "SUBMITTED" || c.status === "IN_PROGRESS"
      ).length || 0;
    const completedCases =
      cases?.filter((c) => c.status === "COMPLETE").length || 0;

    // Calculate revenue
    const paidCases = cases?.filter((c) => c.payment_status === "PAID") || [];
    const totalRevenue = paidCases.reduce((sum, c) => sum + (c.price || 0), 0);

    const unpaidCases =
      cases?.filter((c) => c.payment_status === "UNPAID") || [];
    const pendingPayments = unpaidCases.reduce(
      (sum, c) => sum + (c.price || 0),
      0
    );

    // Group cases by status
    const casesByStatus =
      cases?.reduce((acc: Record<string, number>, case_) => {
        acc[case_.status] = (acc[case_.status] || 0) + 1;
        return acc;
      }, {}) || {};

    // Group cases by county
    const casesByCounty =
      cases?.reduce((acc: Record<string, number>, case_) => {
        const county = case_.properties?.county || "Unknown";
        acc[county] = (acc[county] || 0) + 1;
        return acc;
      }, {}) || {};

    // Get recent activity (simplified for this example)
    const recentActivity = [
      ...(cases?.slice(-5).map((case_) => ({
        id: case_.id || Math.random().toString(),
        type: "case_created" as const,
        description: `New case created`,
        timestamp: case_.created_at,
        metadata: { caseId: case_.id },
      })) || []),
    ].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      totalUsers,
      totalLandlords,
      totalContractors,
      totalProperties: totalProperties || 0,
      totalTenants: totalTenants || 0,
      totalCases,
      activeCases,
      completedCases,
      totalRevenue,
      pendingPayments,
      casesByStatus,
      casesByCounty,
      recentActivity,
    };
  },

  async getUsers(filters?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<UserManagementData> {
    const supabase = createClient();
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("profiles")
      .select("id, username, email, name, role, created_at", {
        count: "exact",
      });

    // Apply filters
    if (filters?.role) {
      query = query.eq("role", filters.role);
    }

    if (filters?.search) {
      query = query.or(
        `username.ilike.%${filters.search}%,email.ilike.%${filters.search}%,name.ilike.%${filters.search}%`
      );
    }

    // Apply pagination
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      users: data || [],
      totalCount: count || 0,
    };
  },

  async updateUserRole(userId: string, role: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteUser(userId: string) {
    const supabase = createClient();
    // Note: This will cascade delete due to foreign key constraints
    const { error } = await supabase.from("profiles").delete().eq("id", userId);

    if (error) throw error;
  },

  async getSystemHealth() {
    const supabase = createClient();

    // Basic system health checks
    const healthChecks = await Promise.allSettled([
      supabase.from("profiles").select("id").limit(1),
      supabase.from("properties").select("id").limit(1),
      supabase.from("tenants").select("id").limit(1),
      supabase.from("legal_cases").select("id").limit(1),
    ]);

    const databaseConnectivity = healthChecks.every(
      (result) => result.status === "fulfilled"
    );

    return {
      databaseConnectivity,
      timestamp: new Date().toISOString(),
      status: databaseConnectivity ? "healthy" : "unhealthy",
    };
  },
};

// Query hooks
export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminService.getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
}

export function useUsers(filters?: {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: adminKeys.usersList(filters),
    queryFn: () => adminService.getUsers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true, // Keep previous data while loading new page
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: adminKeys.systemHealth(),
    queryFn: adminService.getSystemHealth,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000, // Check every 30 seconds
  });
}

// Mutation hooks
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { userId: string; role: string }) =>
      adminService.updateUserRole(variables.userId, variables.role),
    onSuccess: () => {
      // Invalidate users list to refetch with updated data
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      // Invalidate stats since user counts might change
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminService.deleteUser(userId),
    onSuccess: () => {
      // Invalidate users list to refetch without deleted user
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      // Invalidate stats since user counts will change
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}
