import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

export class AuthService {
  private supabase = createClient();

  async signUp(
    email: string,
    password: string,
    userData: {
      username: string;
      name: string;
      role?: "landlord" | "contractor";
    }
  ) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            name: userData.name,
            role: userData.role || "landlord",
          },
        },
      });

      if (error) throw error;

      // Note: Profile creation will be handled by a database trigger or
      // the user will create their profile on first login
      // This avoids RLS issues during signup

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async getCurrentUser() {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async getProfile(
    userId: string
  ): Promise<{ data: Profile | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>) {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async createProfileFromAuth(
    userId: string,
    email: string,
    userData: {
      username: string;
      name: string;
      role: "admin" | "landlord" | "contractor";
    }
  ): Promise<{ data: Profile | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .insert({
          id: userId,
          username: userData.username,
          email: email,
          name: userData.name,
          role: userData.role,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}
