"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { createBrowserClient } from "@supabase/ssr";

export interface DoctorProfile {
  id: string;
  full_name: string;
  specialty: string;
  license_number: string;
  university: string;
  clinic_name: string;
  clinic_subtitle: string;
  clinic_address: string;
  clinic_phone: string;
  clinic_email: string;
  signature_label: string;
  footer_text: string;
  template_style: "classic" | "modern" | "minimal";
  page_size: "full" | "half";
  whatsapp_reminders_enabled: boolean;
  slug?: string | null;
  bio?: string | null;
  profile_photo_url?: string | null;
  gallery_images?: string[] | null;
  clinic_city?: string | null;
  clinic_state?: string | null;
  clinic_postal_code?: string | null;
  social_links?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    whatsapp?: string;
    website?: string;
  } | null;
  schedule_settings?: {
    duration?: number;
    days?: Record<string, { active: boolean; start: string; end: string }>;
    break_enabled?: boolean;
    break_start?: string;
    break_end?: string;
  } | null;
  teleconsulta_enabled?: boolean;
  teleconsulta_price?: number;
  presencial_price?: number;
  payment_required?: boolean;
  mp_client_id?: string | null;
  mp_access_token?: string | null;
  mp_refresh_token?: string | null;
  country_code?: string;
  currency?: string;
  stripe_account_id?: string | null;
  stripe_onboarding_completed?: boolean;
  bank_name?: string | null;
  bank_account_clabe?: string | null;
  bank_beneficiary_name?: string | null;
  bank_rfc?: string | null;
  payment_mode?: 'ninguno' | 'anticipo' | 'completo';
  anticipo_amount?: number;
}

const DEFAULT_PROFILE: DoctorProfile = {
  id: "",
  full_name: "",
  specialty: "",
  license_number: "",
  university: "",
  clinic_name: "",
  clinic_subtitle: "",
  clinic_address: "",
  clinic_phone: "",
  clinic_email: "",
  signature_label: "",
  footer_text: "Esta receta es un documento médico oficial.",
  template_style: "classic",
  page_size: "full",
  whatsapp_reminders_enabled: true,
  slug: "",
  bio: "",
  profile_photo_url: "",
  gallery_images: [],
  clinic_city: "",
  clinic_state: "",
  clinic_postal_code: "",
  social_links: {},
  schedule_settings: {
    duration: 30,
    days: {
      "1": { active: true, start: "09:00", end: "18:00" },
      "2": { active: true, start: "09:00", end: "18:00" },
      "3": { active: true, start: "09:00", end: "18:00" },
      "4": { active: true, start: "09:00", end: "18:00" },
      "5": { active: true, start: "09:00", end: "18:00" },
      "6": { active: false, start: "09:00", end: "14:00" },
      "0": { active: false, start: "09:00", end: "14:00" }
    },
    break_enabled: false,
    break_start: "14:00",
    break_end: "15:00"
  },
  teleconsulta_enabled: false,
  teleconsulta_price: 0,
  presencial_price: 0,
  payment_required: false,
  mp_client_id: null,
  mp_access_token: null,
  mp_refresh_token: null,
  country_code: "MX",
  currency: "MXN",
  stripe_account_id: null,
  stripe_onboarding_completed: false,
  bank_name: "",
  bank_account_clabe: "",
  bank_beneficiary_name: "",
  bank_rfc: "",
  payment_mode: "ninguno",
  anticipo_amount: 0
};

interface DoctorProfileContextType {
  profile: DoctorProfile;
  isLoading: boolean;
  updateProfile: (updates: Partial<DoctorProfile>) => Promise<void>;
  refetch: () => Promise<void>;
}

const DoctorProfileContext = createContext<DoctorProfileContextType>({
  profile: DEFAULT_PROFILE,
  isLoading: true,
  updateProfile: async () => {},
  refetch: async () => {},
});

export function DoctorProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<DoctorProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get current auth user first to filter by user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("doctor_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching doctor profile:", error);
      } else if (data) {
        setProfile(data as DoctorProfile);
      }
    } catch (err) {
      console.error("Unexpected error in fetchProfile:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    
    // Failsafe timeout
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<DoctorProfile>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("doctor_profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    // Update state immediately for real-time UI feedback
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  return (
    <DoctorProfileContext.Provider value={{ profile, isLoading, updateProfile, refetch: fetchProfile }}>
      {children}
    </DoctorProfileContext.Provider>
  );
}

export function useDoctorProfile() {
  return useContext(DoctorProfileContext);
}
