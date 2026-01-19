"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { UserProfile } from "@/types";

export function useAuth() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const extractProfile = useCallback(
    (user: { email?: string; user_metadata?: Record<string, string> } | null): UserProfile | null => {
      if (!user) return null;
      return {
        fullName: user.user_metadata?.full_name || user.email || "Account",
        company: user.user_metadata?.company || "Your company",
        email: user.email || "",
      };
    },
    []
  );

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setUserProfile(extractProfile(data.user));
    }
  }, [extractProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAccessToken(null);
    setUserProfile(null);
    router.push("/");
  }, [router]);

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token ?? null;
      setAccessToken(token);
      setUserProfile(extractProfile(data.session?.user ?? null));
      setIsLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token ?? null;
      setAccessToken(token);
      setUserProfile(extractProfile(session?.user ?? null));
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [extractProfile]);

  return {
    accessToken,
    userProfile,
    isLoading,
    isAuthenticated: !!accessToken,
    signOut,
    refreshProfile,
  };
}
