"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";
import { useRouter } from "next/navigation";

const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  profile: (userId: string) => [...authKeys.all, "profile", userId] as const,
};

// Auth service functions (pure functions without class)
const authService = {
  async signUp(
    email: string,
    password: string,
    userData: {
      username: string;
      name: string;
      role?: "landlord" | "contractor";
    }
  ) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
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
    return data;
  },

  async signIn(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
  },

  async getProfile(userId: string): Promise<Profile> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createProfileFromAuth(
    userId: string,
    email: string,
    userData: {
      username: string;
      name: string;
      role: "admin" | "landlord" | "contractor";
    }
  ): Promise<Profile> {
    const supabase = createClient();
    const { data, error } = await supabase
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
    return data;
  },
};

// Query hooks
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: authService.getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

export function useProfile(userId?: string) {
  return useQuery({
    queryKey: authKeys.profile(userId!),
    queryFn: () => authService.getProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Mutation hooks
export function useSignUp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (variables: {
      email: string;
      password: string;
      userData: {
        username: string;
        name: string;
        role?: "landlord" | "contractor";
      };
    }) =>
      authService.signUp(
        variables.email,
        variables.password,
        variables.userData
      ),
    onSuccess: () => {
      // Redirect to login page after successful signup
      router.push("/login");
    },
    onError: (error) => {
      console.error("Signup error:", error);
    },
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (variables: { email: string; password: string }) =>
      authService.signIn(variables.email, variables.password),
    onSuccess: (data) => {
      // Invalidate user queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: authKeys.user() });

      if (data?.user) {
        // Small delay to ensure auth state is updated
        setTimeout(() => {
          router.push("/dashboard");
        }, 100);
      }
    },
    onError: (error) => {
      console.error("Login error:", error);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      // Clear all auth-related queries
      queryClient.removeQueries({ queryKey: authKeys.all });
      // Clear all data from cache on logout
      queryClient.clear();
      router.push("/login");
    },
    onError: (error) => {
      console.error("Logout error:", error);
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { userId: string; updates: Partial<Profile> }) =>
      authService.updateProfile(variables.userId, variables.updates),
    onSuccess: (data, variables) => {
      // Update the profile in cache
      queryClient.setQueryData(authKeys.profile(variables.userId), data);
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: {
      userId: string;
      email: string;
      userData: {
        username: string;
        name: string;
        role: "admin" | "landlord" | "contractor";
      };
    }) =>
      authService.createProfileFromAuth(
        variables.userId,
        variables.email,
        variables.userData
      ),
    onSuccess: (data, variables) => {
      // Set the new profile in cache
      queryClient.setQueryData(authKeys.profile(variables.userId), data);
      // Invalidate user query to refetch
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
}
