-- Migration: Doctor Profiles and Online Appointments (Alter Existing Tables)

-- 1. Add new columns to the existing public.doctor_profiles table
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS schedule_settings JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 2. Add columns to public.appointments table for online booking
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS public_patient_name TEXT,
ADD COLUMN IF NOT EXISTS public_patient_phone TEXT,
ADD COLUMN IF NOT EXISTS public_patient_email TEXT,
ADD COLUMN IF NOT EXISTS match_status TEXT CHECK (match_status IN ('linked', 'pending', 'new_patient'));

-- 3. Create RLS Policies for public read access on doctor profiles
DROP POLICY IF EXISTS "Allow public select on doctor profiles" ON public.doctor_profiles;
CREATE POLICY "Allow public select on doctor profiles" 
ON public.doctor_profiles FOR SELECT 
USING (true);

-- 4. Enable Realtime for doctor_profiles and appointments
-- Note: If these tables are already in the publication, they will just be skipped or updated.
-- To prevent errors, we run this block.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'doctor_profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_profiles;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;
END $$;
