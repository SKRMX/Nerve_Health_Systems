"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  clinic_id: string;
  role: "admin" | "doctor" | "receptionist" | "superadmin";
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  active: boolean;
}

interface Clinic {
  id: string;
  name: string;
  subscription_tier: "solo" | "pro" | "enterprise";
  subscription_status?: string;
  current_period_end?: string;
  mp_subscription_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  clinic: Clinic | null;
  isLoading: boolean;
  isAdmin: boolean;
  isDoctor: boolean;
  isReceptionist: boolean;
  isSuperadmin: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  clinic: null,
  isLoading: true,
  isAdmin: false,
  isDoctor: false,
  isReceptionist: false,
  isSuperadmin: false,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  // Fetch profile via server-side API route (bypasses RLS)
  const fetchUserData = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      
      if (!res.ok) {
        console.error("Failed to fetch profile:", res.status);
        return;
      }

      const data = await res.json();
      
      if (data.profile) {
        setUserProfile(data.profile as UserProfile);
      }
      if (data.clinic) {
        setClinic(data.clinic as Clinic);
      }
    } catch (err) {
      console.error("fetchUserData error:", err);
    } finally {
      hasLoadedRef.current = true;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error("Session error:", error);
          setIsLoading(false);
        } else if (session?.user) {
          setUser(session.user);
          await fetchUserData();
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("initAuth error:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === "SIGNED_IN" && session?.user && !hasLoadedRef.current) {
          setUser(session.user);
          setIsLoading(true);
          await fetchUserData();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setUserProfile(null);
          setClinic(null);
          hasLoadedRef.current = false;
          setIsLoading(false);
        }
      }
    );

    // Safety net — 6 seconds max
    const timeout = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 6000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchUserData]);

  const signOut = useCallback(() => {
    setUser(null);
    setUserProfile(null);
    setClinic(null);
    hasLoadedRef.current = false;
    supabase.auth.signOut({ scope: 'local' }).finally(() => {
      window.location.href = "/login";
    });
  }, []);

  const role = userProfile?.role;

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      clinic,
      isLoading,
      isAdmin: role === "admin" || role === "superadmin",
      isDoctor: role === "doctor" || role === "admin",
      isReceptionist: role === "receptionist",
      isSuperadmin: role === "superadmin",
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
