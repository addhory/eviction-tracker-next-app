// =============================================================================
// AUTH HOOKS (DRY + No RPC Functions)
// =============================================================================

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth-service";
import { UserRole, Profile } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// =============================================================================
// SHARED QUERY KEY FACTORY (DRY)
// =============================================================================

export const authKeys = {
  all: ["auth"] as const,
  currentUser: () => [...authKeys.all, "current-user"] as const,
  profile: (userId?: string) => [...authKeys.all, "profile", userId] as const,
  role: () => [...authKeys.all, "role"] as const,
  isAdmin: () => [...authKeys.all, "is-admin"] as const,
  isContractor: () => [...authKeys.all, "is-contractor"] as const,
  isLandlord: () => [...authKeys.all, "is-landlord"] as const,
} as const;

// =============================================================================
// SHARED CONFIGURATION (DRY)
// =============================================================================

const AUTH_QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Get current user and profile
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser(),
    queryFn: async () => {
      const result = await authService.getCurrentUser();
      if (result.error) throw result.error;
      return result.data!;
    },
    ...AUTH_QUERY_CONFIG,
  });
}

/**
 * Get user profile by ID
 */
export function useProfile(userId?: string) {
  return useQuery({
    queryKey: authKeys.profile(userId),
    queryFn: async () => {
      if (!userId) return null;
      return await authService.getUserProfile(userId);
    },
    enabled: !!userId,
    ...AUTH_QUERY_CONFIG,
  });
}

/**
 * Get current user's role
 */
export function useCurrentUserRole() {
  return useQuery({
    queryKey: authKeys.role(),
    queryFn: async () => {
      return await authService.getCurrentUserRole();
    },
    ...AUTH_QUERY_CONFIG,
  });
}

/**
 * Check if current user is admin
 */
export function useIsAdmin() {
  return useQuery({
    queryKey: authKeys.isAdmin(),
    queryFn: async () => {
      return await authService.isAdmin();
    },
    ...AUTH_QUERY_CONFIG,
  });
}

/**
 * Check if current user is contractor
 */
export function useIsContractor() {
  return useQuery({
    queryKey: authKeys.isContractor(),
    queryFn: async () => {
      return await authService.isContractor();
    },
    ...AUTH_QUERY_CONFIG,
  });
}

/**
 * Check if current user is landlord
 */
export function useIsLandlord() {
  return useQuery({
    queryKey: authKeys.isLandlord(),
    queryFn: async () => {
      return await authService.isLandlord();
    },
    ...AUTH_QUERY_CONFIG,
  });
}

// =============================================================================
// MUTATION HOOKS
// =============================================================================

/**
 * Sign in mutation
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const result = await authService.signIn(email, password);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: (data) => {
      // Update all auth-related queries
      queryClient.setQueryData(authKeys.currentUser(), data);
      if (data.profile) {
        queryClient.setQueryData(authKeys.profile(data.user.id), data.profile);
        queryClient.setQueryData(authKeys.role(), data.profile.role);
        queryClient.setQueryData(
          authKeys.isAdmin(),
          data.profile.role === "admin"
        );
        queryClient.setQueryData(
          authKeys.isContractor(),
          data.profile.role === "contractor"
        );
        queryClient.setQueryData(
          authKeys.isLandlord(),
          data.profile.role === "landlord"
        );

        // Smart routing based on role
        toast.success("Login successful! Redirecting...");
        setTimeout(() => {
          switch (data.profile?.role) {
            case "landlord":
              router.push("/dashboard");
              break;
            case "admin":
              router.push("/admin");
              break;
            case "contractor":
              router.push("/contractor/dashboard");
              break;
            default:
              router.push("/login");
          }
        }, 100);
      }
    },
    onError: (error) => {
      console.error("Sign in error:", error);
      toast.error("Login failed. Please check your credentials.");
    },
  });
}

/**
 * Sign up mutation
 */
export function useSignUp() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      email,
      password,
      userData,
    }: {
      email: string;
      password: string;
      userData: {
        username: string;
        name: string;
        phone?: string;
        business_name?: string | null;
        referral_code?: string | null;
        address?: string;
        role?: UserRole;
      };
    }) => {
      const result = await authService.signUp(email, password, userData);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: (data) => {
      // Update auth queries if user was created successfully
      if (data.user) {
        queryClient.setQueryData(authKeys.currentUser(), data);
        if (data.profile) {
          queryClient.setQueryData(
            authKeys.profile(data.user.id),
            data.profile
          );
          queryClient.setQueryData(authKeys.role(), data.profile.role);
        }
      }

      toast.success("Account created successfully! Please check your email.");
      router.push("/login");
    },
    onError: (error) => {
      console.error("Sign up error:", error);
      toast.error("Signup failed. Please try again.");
    },
  });
}

/**
 * Sign out mutation
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const result = await authService.signOut();
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      // Clear all auth-related data
      queryClient.setQueryData(authKeys.currentUser(), {
        user: null,
        profile: null,
      });
      queryClient.setQueryData(authKeys.role(), null);
      queryClient.setQueryData(authKeys.isAdmin(), false);
      queryClient.setQueryData(authKeys.isContractor(), false);
      queryClient.setQueryData(authKeys.isLandlord(), false);

      // Clear all cached data
      queryClient.clear();

      toast.success("Logged out successfully");
      router.push("/login");
    },
    onError: (error) => {
      console.error("Sign out error:", error);
      toast.error("Logout failed. Please try again.");
    },
  });
}

/**
 * Update profile mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Partial<Profile>;
    }) => {
      const result = await authService.updateProfile(userId, updates);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: (data, variables) => {
      // Update profile in cache
      queryClient.setQueryData(authKeys.profile(variables.userId), data);

      // Update current user if it's the same user
      const currentUserData = queryClient.getQueryData(
        authKeys.currentUser()
      ) as any;
      if (currentUserData?.user?.id === variables.userId) {
        queryClient.setQueryData(authKeys.currentUser(), {
          ...currentUserData,
          profile: data,
        });

        // Update role-related queries if role changed
        if (data.role) {
          queryClient.setQueryData(authKeys.role(), data.role);
          queryClient.setQueryData(authKeys.isAdmin(), data.role === "admin");
          queryClient.setQueryData(
            authKeys.isContractor(),
            data.role === "contractor"
          );
          queryClient.setQueryData(
            authKeys.isLandlord(),
            data.role === "landlord"
          );
        }
      }

      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile");
    },
  });
}

/**
 * Create profile mutation (for admin use)
 */
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      email,
      userData,
    }: {
      userId: string;
      email: string;
      userData: {
        username: string;
        name: string;
        role: UserRole;
        phone?: string;
        business_name?: string;
      };
    }) => {
      const result = await authService.createProfile(userId, email, userData);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: (data, variables) => {
      // Cache the new profile
      queryClient.setQueryData(authKeys.profile(variables.userId), data);
      toast.success("Profile created successfully");
    },
    onError: (error) => {
      console.error("Create profile error:", error);
      toast.error("Failed to create profile");
    },
  });
}

/**
 * Reset password mutation
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const result = await authService.resetPassword(email);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      toast.success("Password reset email sent!");
    },
    onError: (error) => {
      console.error("Reset password error:", error);
      toast.error("Failed to send reset email");
    },
  });
}

/**
 * Update password mutation
 */
export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const result = await authService.updatePassword(newPassword);
      if (result.error) throw result.error;
      return result.data!;
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (error) => {
      console.error("Update password error:", error);
      toast.error("Failed to update password");
    },
  });
}

// =============================================================================
// COMPOUND HOOKS (DRY)
// =============================================================================

/**
 * Get comprehensive auth state
 */
export function useAuthState() {
  const currentUser = useCurrentUser();
  const role = useCurrentUserRole();
  const isAdmin = useIsAdmin();
  const isContractor = useIsContractor();
  const isLandlord = useIsLandlord();

  return {
    user: currentUser.data?.user || null,
    profile: currentUser.data?.profile || null,
    role: role.data,
    isAdmin: isAdmin.data || false,
    isContractor: isContractor.data || false,
    isLandlord: isLandlord.data || false,
    isLoading: currentUser.isLoading || role.isLoading,
    isError: currentUser.isError || role.isError,
    error: currentUser.error || role.error,
  };
}

/**
 * Check if user has specific role
 */
export function useHasRole(requiredRole: UserRole) {
  const { role } = useAuthState();
  return role === requiredRole;
}

/**
 * Check if user has any of the specified roles
 */
export function useHasAnyRole(roles: UserRole[]) {
  const { role } = useAuthState();
  return role ? roles.includes(role) : false;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Invalidate all auth queries
 */
export function useInvalidateAuth() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: authKeys.all });
  };
}
