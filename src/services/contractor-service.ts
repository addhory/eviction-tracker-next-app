import { createClient } from "@/lib/supabase/client";
import { Contractor, ContractorFormData, ContractorUpdateData } from "@/types";

export interface ContractorListData {
  contractors: Contractor[];
  totalCount: number;
}

export class ContractorService {
  private supabase = createClient();

  async getContractors(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ data: ContractorListData | null; error: Error | null }> {
    try {
      let query = this.supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .eq("role", "contractor");

      // Apply search filter
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

      const contractors = (data as Contractor[]) || [];

      return {
        data: {
          contractors,
          totalCount: count || 0,
        },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async getContractor(
    id: string
  ): Promise<{ data: Contractor | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .eq("role", "contractor")
        .single();

      if (error) throw error;

      return { data: data as Contractor, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async createContractor(
    contractorData: ContractorFormData
  ): Promise<{ data: Contractor | null; error: Error | null }> {
    try {
      // Use regular signUp (same as landlord creation) instead of admin.createUser
      const { data: authData, error: authError } =
        await this.supabase.auth.signUp({
          email: contractorData.email,
          password: contractorData.password,
          options: {
            data: {
              name: contractorData.name,
              username: contractorData.username,
              phone: contractorData.phone,
              role: "contractor",
            },
          },
        });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // The profile will be automatically created via database trigger
      // Wait a moment and then fetch the profile
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Fetch the created profile
      const { data: profile, error: fetchError } = await this.supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .eq("role", "contractor")
        .single();

      if (fetchError) {
        console.error("Error fetching contractor profile:", fetchError);
        throw new Error("Failed to retrieve contractor profile after creation");
      }

      return { data: profile as Contractor, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async updateContractor(
    id: string,
    contractorData: ContractorUpdateData
  ): Promise<{ data: Contractor | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .update({
          ...contractorData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("role", "contractor")
        .select()
        .single();

      if (error) throw error;

      return { data: data as Contractor, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  async deleteContractor(id: string): Promise<{ error: Error | null }> {
    try {
      // Call the secure Edge Function instead of direct admin API
      const { data, error } = await this.supabase.functions.invoke(
        "delete-user",
        {
          body: {
            userId: id,
            userRole: "contractor",
          },
        }
      );

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async getContractorStats(id: string): Promise<{
    data: { totalCompletions: number } | null;
    error: Error | null;
  }> {
    try {
      // TODO: Implement when job/case completion tracking is added
      // For now, return mock data based on contractor ID
      const seed = id
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const totalCompletions = (seed % 10) + 1;

      return {
        data: { totalCompletions },
        error: null,
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}

export const contractorService = new ContractorService();
