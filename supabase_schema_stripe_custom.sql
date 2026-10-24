-- ================================================================
-- Migration: Stripe Connect Custom & Internationalization Support
-- ================================================================

-- 1. Alter public.doctor_profiles table
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'MX',
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN',
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_clabe TEXT,
ADD COLUMN IF NOT EXISTS bank_beneficiary_name TEXT,
ADD COLUMN IF NOT EXISTS bank_rfc TEXT,
ADD COLUMN IF NOT EXISTS payment_mode TEXT NOT NULL DEFAULT 'ninguno' CHECK (payment_mode IN ('ninguno', 'anticipo', 'completo')),
ADD COLUMN IF NOT EXISTS anticipo_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- 2. Alter public.clinics table (fallback/tenant-level config)
ALTER TABLE public.clinics
ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'MX',
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'MXN';

-- 3. Modify appointments table payment_status checklist constraint if needed
-- We already have checking: CHECK (payment_status IN ('no_requerido', 'pendiente', 'pagado', 'fallido'))
-- We also add a column to track checkout session ID for Stripe
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT;
