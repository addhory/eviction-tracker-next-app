"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  useCurrentUser,
  useProfile,
  useCreateProfile,
  useSignOut,
} from "@/hooks/queries/use-auth";
import { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: false,
  signOut: () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());

  // Use TanStack Query hooks - this is our single source of truth
  const { data: currentUserData, isLoading: isUserLoading } = useCurrentUser();
  const { data: profileData, isLoading: isProfileLoading } = useProfile(
    currentUserData?.user?.id
  );
  const createProfileMutation = useCreateProfile();
  const signOutMutation = useSignOut();

  // Handle automatic profile creation when user exists but profile doesn't
  useEffect(() => {
    if (
      currentUserData?.user &&
      !profileData &&
      !isProfileLoading &&
      !createProfileMutation.isPending
    ) {
      console.log(
        "Profile not found, creating for user:",
        currentUserData.user.id
      );
      const metadata = currentUserData.user.user_metadata;
      createProfileMutation.mutate({
        userId: currentUserData.user.id,
        email: currentUserData.user.email || "",
        userData: {
          username:
            metadata?.username ||
            currentUserData.user.email?.split("@")[0] ||
            "",
          name:
            metadata?.name || currentUserData.user.email?.split("@")[0] || "",
          role: metadata?.role || "landlord",
        },
      });
    }
  }, [
    currentUserData?.user,
    profileData,
    isProfileLoading,
    createProfileMutation,
  ]);

  // Listen for auth state changes to invalidate queries when needed
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // TanStack Query will automatically handle state updates
      // We only need to listen for logout to potentially clear any client-only state
      if (event === "SIGNED_OUT") {
        // Query cache will be cleared by the signOut mutation
        console.log("User signed out");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // Simplified signOut that relies on TanStack Query mutation
  const signOut = () => {
    signOutMutation.mutate();
  };

  // Derive all values directly from TanStack Query state
  const value: AuthContextType = {
    user: currentUserData?.user || null,
    profile: profileData || null,
    loading:
      isUserLoading || isProfileLoading || createProfileMutation.isPending,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
