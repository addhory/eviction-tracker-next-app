import { createClient } from "@/lib/supabase/client";
import { Profile, Property, Tenant, LegalCase } from "@/types";

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
  recentActivity: Array<{
    id: string;
    type:
      | "user_registered"
      | "case_created"
      | "case_completed"
      | "document_generated";
    description: string;
    timestamp: string;
    user_name?: string;
  }>;
  casesByStatus: Record<string, number>;
  casesByCounty: Record<string, number>;
  monthlyGrowth: Array<{
    month: string;
    users: number;
    cases: number;
    revenue: number;
  }>;
}

export interface UserManagementData {
  users: Array<
    Profile & {
      total_properties?: number;
      total_cases?: number;
      last_activity?: string;
    }
  >;
  totalCount: number;
}

export class AdminService {
  private supabase = createClient();

  async getDashboardStats(): Promise<{
    data: AdminStats | null;
    error: Error | null;
  }> {
    try {
      // Get user counts
      const { data: profiles, error: profilesError } = await this.supabase
        .from("profiles")
        .select("role, created_at");

      if (profilesError) throw profilesError;

      const totalUsers = profiles?.length || 0;
      const totalLandlords =
        profiles?.filter((p) => p.role === "landlord").length || 0;
      const totalContractors =
        profiles?.filter((p) => p.role === "contractor").length || 0;

      // Get property count
      const { count: totalProperties } = await this.supabase
        .from("properties")
        .select("*", { count: "exact", head: true });

      // Get tenant count
      const { count: totalTenants } = await this.supabase
        .from("tenants")
        .select("*", { count: "exact", head: true });

      // Get case statistics
      const { data: cases, error: casesError } = await this.supabase
        .from("legal_cases")
        .select(
          "status, payment_status, price, created_at, properties(county)"
        );

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
      const totalRevenue = paidCases.reduce(
        (sum, c) => sum + (c.price || 0),
        0
      );

      const unpaidCases =
        cases?.filter((c) => c.payment_status === "UNPAID") || [];
      const pendingPayments = unpaidCases.reduce(
        (sum, c) => sum + (c.price || 0),
        0
      );

      // Group cases by status
      const casesByStatus =
        cases?.reduce((acc, c) => {
          const status = c.status || "UNKNOWN";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      // Group cases by county
      const casesByCounty =
        cases?.reduce((acc, c) => {
          const county = c.properties?.county || "Unknown";
          acc[county] = (acc[county] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      // Calculate monthly growth (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyGrowth = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const monthUsers =
          profiles?.filter((p) => {
            const createdAt = new Date(p.created_at || "");
            return createdAt >= monthStart && createdAt <= monthEnd;
          }).length || 0;

        const monthCases =
          cases?.filter((c) => {
            const createdAt = new Date(c.created_at || "");
            return createdAt >= monthStart && createdAt <= monthEnd;
          }) || [];

        const monthRevenue = monthCases
          .filter((c) => c.payment_status === "PAID")
          .reduce((sum, c) => sum + (c.price || 0), 0);

        monthlyGrowth.push({
          month: date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          users: monthUsers,
          cases: monthCases.length,
          revenue: monthRevenue,
        });
      }

      // Get recent activity (simplified for now)
      const recentCases =
        cases
          ?.sort(
            (a, b) =>
              new Date(b.created_at || "").getTime() -
              new Date(a.created_at || "").getTime()
          )
          .slice(0, 10) || [];

      const recentActivity = recentCases.map((c) => ({
        id: c.id || "",
        type: "case_created" as const,
        description: `New ${c.case_type || "FTPR"} case created`,
        timestamp: c.created_at || new Date().toISOString(),
      }));

      const stats: AdminStats = {
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
        recentActivity,
        casesByStatus,
        casesByCounty,
        monthlyGrowth,
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getUsers(
    page: number = 1,
    limit: number = 20,
    role?: string,
    search?: string
  ): Promise<{ data: UserManagementData | null; error: Error | null }> {
    try {
      let query = this.supabase.from("profiles").select(
        `
          *,
          properties(count),
          legal_cases(count)
        `,
        { count: "exact" }
      );

      // Apply filters
      if (role && role !== "all") {
        query = query.eq("role", role);
      }

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
        );
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Order by creation date
      query = query.order("created_at", { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const users =
        data?.map((user) => ({
          ...user,
          total_properties: user.properties?.length || 0,
          total_cases: user.legal_cases?.length || 0,
          last_activity: user.updated_at || user.created_at,
        })) || [];

      return {
        data: {
          users,
          totalCount: count || 0,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async updateUserRole(
    userId: string,
    newRole: "admin" | "landlord" | "contractor"
  ): Promise<{ data: Profile | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async deleteUser(userId: string): Promise<{ error: Error | null }> {
    try {
      // Note: This should cascade delete related data based on your database constraints
      const { error } = await this.supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getSystemHealth(): Promise<{
    data: {
      database: boolean;
      auth: boolean;
      storage: boolean;
      apiResponseTime: number;
    } | null;
    error: Error | null;
  }> {
    try {
      const startTime = Date.now();

      // Test database connection
      const { error: dbError } = await this.supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single();

      const apiResponseTime = Date.now() - startTime;

      // Test auth (simplified)
      const { data: authData } = await this.supabase.auth.getUser();

      return {
        data: {
          database: !dbError,
          auth: !!authData,
          storage: true, // Simplified for now
          apiResponseTime,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}
