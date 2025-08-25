// =============================================================================
// AUTH SERVICE (DRY + No RPC Functions)
// =============================================================================

import { createClient } from "@/lib/supabase/client";
import {
  TypedSupabaseClient,
  ServiceResponse,
  UserRole,
  TABLE_NAMES,
} from "@/lib/supabase/types";
import {
  createSuccessResponse,
  createErrorResponse,
  handleServiceError,
} from "@/lib/supabase/query-utils";
import { Profile } from "@/types";

// =============================================================================
// AUTH SERVICE (Refactored - No RPC Functions)
// =============================================================================

export class AuthService {
  private supabase: TypedSupabaseClient;

  constructor() {
    this.supabase = createClient();
  }

  // =============================================================================
  // AUTHENTICATION METHODS
  // =============================================================================

  /**
   * Sign in with email and password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<ServiceResponse<{ user: any; profile: Profile | null }>> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile
      const profile = await this.getUserProfile(data.user.id);

      return createSuccessResponse({
        user: data.user,
        profile,
      });
    } catch (error) {
      return createErrorResponse(handleServiceError(error, "signIn"));
    }
  }

  /**
   * Sign up with email and password
   */
  async signUp(
    email: string,
    password: string,
    userData: {
      username: string;
      name: string;
      role?: UserRole;
    }
  ): Promise<ServiceResponse<{ user: any; profile: Profile | null }>> {
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

      // The profile should be created automatically by the trigger
      // But let's wait a moment and then fetch it
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const profile = data.user
        ? await this.getUserProfile(data.user.id)
        : null;

      return createSuccessResponse({
        user: data.user,
        profile,
      });
    } catch (error) {
      return createErrorResponse(handleServiceError(error, "signUp"));
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(handleServiceError(error, "signOut"));
    }
  }

  /**
   * Get current user and session
   */
  async getCurrentUser(): Promise<
    ServiceResponse<{ user: any; profile: Profile | null }>
  > {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        return createSuccessResponse({ user: null, profile: null });
      }

      const profile = await this.getUserProfile(user.id);

      return createSuccessResponse({
        user,
        profile,
      });
    } catch (error) {
      return createErrorResponse(handleServiceError(error, "getCurrentUser"));
    }
  }

  // =============================================================================
  // PROFILE METHODS (Direct Database Access)
  // =============================================================================

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROFILES)
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      return data as Profile;
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<ServiceResponse<Profile>> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROFILES)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;

      return createSuccessResponse(data as Profile);
    } catch (error) {
      return createErrorResponse(handleServiceError(error, "updateProfile"));
    }
  }

  /**
   * Create profile (for admin user creation)
   */
  async createProfile(
    userId: string,
    email: string,
    userData: {
      username: string;
      name: string;
      role: UserRole;
      phone?: string;
      business_name?: string;
    }
  ): Promise<ServiceResponse<Profile>> {
    try {
      const { data, error } = await this.supabase
        .from(TABLE_NAMES.PROFILES)
        .insert({
          id: userId,
          username: userData.username,
          email: email,
          name: userData.name,
          role: userData.role,
          phone: userData.phone,
          business_name: userData.business_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return createSuccessResponse(data as Profile);
    } catch (error) {
      return createErrorResponse(handleServiceError(error, "createProfile"));
    }
  }

  // =============================================================================
  // ROLE CHECKING METHODS (Direct Database Access - No RPC)
  // =============================================================================

  /**
   * Check if current user is admin
   */
  async isAdmin(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return false;

      const profile = await this.getUserProfile(user.id);
      return profile?.role === "admin";
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
  }

  /**
   * Check if current user is contractor
   */
  async isContractor(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return false;

      const profile = await this.getUserProfile(user.id);
      return profile?.role === "contractor";
    } catch (error) {
      console.error("Error checking contractor role:", error);
      return false;
    }
  }

  /**
   * Check if current user is landlord
   */
  async isLandlord(): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return false;

      const profile = await this.getUserProfile(user.id);
      return profile?.role === "landlord";
    } catch (error) {
      console.error("Error checking landlord role:", error);
      return false;
    }
  }

  /**
   * Get current user's role
   */
  async getCurrentUserRole(): Promise<UserRole | null> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return null;

      const profile = await this.getUserProfile(user.id);
      return profile?.role || null;
    } catch (error) {
      console.error("Error getting user role:", error);
      return null;
    }
  }

  // =============================================================================
  // PASSWORD METHODS
  // =============================================================================

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(handleServiceError(error, "resetPassword"));
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return createSuccessResponse(undefined);
    } catch (error) {
      return createErrorResponse(handleServiceError(error, "updatePassword"));
    }
  }

  // =============================================================================
  // AUTH STATE LISTENERS
  // =============================================================================

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  // =============================================================================
  // BACKWARD COMPATIBILITY METHODS
  // =============================================================================

  /**
   * @deprecated Use getUserProfile instead
   */
  async getProfile(userId: string) {
    const profile = await this.getUserProfile(userId);
    return { data: profile, error: null };
  }

  /**
   * @deprecated Use createProfile instead
   */
  async createProfileFromAuth(
    userId: string,
    email: string,
    userData: {
      username: string;
      name: string;
      role: "admin" | "landlord" | "contractor";
    }
  ) {
    const result = await this.createProfile(userId, email, userData);
    return { data: result.data, error: result.error };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const authService = new AuthService();
