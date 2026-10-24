-- 1. Enable RLS on all critical tables
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- 2. Clean existing permissive policies if any
DROP POLICY IF EXISTS "Public can see" ON public.clinics;
DROP POLICY IF EXISTS "All can see" ON public.clinics;

-- 3. CLINICS Policy: Users can see only their own clinic details
CREATE POLICY "Users can view their own clinic" ON public.clinics
    FOR SELECT USING (
        id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid())
    );

-- 4. USERS Policy: Users can see teammates within the same clinic
CREATE POLICY "Users can view teammate profiles" ON public.users
    FOR SELECT USING (
        clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid())
    );

-- 5. PATIENTS Policy: Access limited by clinic_id
CREATE POLICY "Clinic isolation for patients" ON public.patients
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()))
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- 6. APPOINTMENTS Policy: Access limited by clinic_id
CREATE POLICY "Clinic isolation for appointments" ON public.appointments
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()))
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- 7. MEDICAL RECORDS Policy: Access limited by clinic_id
CREATE POLICY "Clinic isolation for medical_records" ON public.medical_records
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()))
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- 8. PRESCRIPTIONS Policy: Access limited by clinic_id
CREATE POLICY "Clinic isolation for prescriptions" ON public.prescriptions
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()))
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

-- Enable RLS for doctor_profiles too
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic isolation for doctor_profiles" ON public.doctor_profiles
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()))
    WITH CHECK (clinic_id IN (SELECT clinic_id FROM public.users WHERE id = auth.uid()));

