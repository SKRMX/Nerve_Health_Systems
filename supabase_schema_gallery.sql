-- Migration: Add gallery images and detailed address support to doctor profiles

ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS clinic_city TEXT,
ADD COLUMN IF NOT EXISTS clinic_state TEXT,
ADD COLUMN IF NOT EXISTS clinic_postal_code TEXT;
