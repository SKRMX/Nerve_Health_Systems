-- ==========================================
-- NERVE Health Systems - Multi-Tenant Schema
-- ==========================================

-- 1. Tablas Core

-- Tenants (Clínicas o Doctores Solos)
CREATE TABLE public.clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subscription_tier TEXT CHECK (subscription_tier IN ('solo', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles vinculados a Supabase Auth
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('doctor', 'receptionist')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pacientes
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    birth_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Citas (Agenda)
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.users(id),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expediente Clínico
CREATE TABLE public.medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.users(id),
    clinical_notes TEXT NOT NULL,
    diagnosis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recetas
CREATE TABLE public.prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.users(id),
    details JSONB NOT NULL,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. Row Level Security (RLS)
-- Garantizar el aislamiento de red (Multi-Tenancy)
-- ==========================================

ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Funciones Auxiliares para Políticas
CREATE OR REPLACE FUNCTION public.get_user_clinic()
RETURNS UUID AS $$
    SELECT clinic_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas de RLS generales: Los usuarios solo pueden ver la data donde clinic_id coincida con su propia clinic_id

-- CLINICS: Puedo ver mi propia clínica
CREATE POLICY "Users can view their own clinic" ON public.clinics
  FOR SELECT USING (id = public.get_user_clinic());

-- USERS: Puedo ver usuarios de mi clínica
CREATE POLICY "Users can view members of their clinic" ON public.users
  FOR SELECT USING (clinic_id = public.get_user_clinic());

-- PATIENTS: Todos en la clínica pueden ver, insertar y modificar
CREATE POLICY "Clinic members can manage patients" ON public.patients
  FOR ALL USING (clinic_id = public.get_user_clinic());

-- APPOINTMENTS: Todos en la clínica pueden gestionar citas
CREATE POLICY "Clinic members can manage appointments" ON public.appointments
  FOR ALL USING (clinic_id = public.get_user_clinic());

-- MEDICAL RECORDS & PRESCRIPTIONS:
-- Recepcionistas NO TIENEN ACCESO a notas ni recetas.
-- Solo doctores de la misma clínica.

CREATE POLICY "Only doctors can view medical records" ON public.medical_records
  FOR SELECT USING (clinic_id = public.get_user_clinic() AND public.get_user_role() = 'doctor');

CREATE POLICY "Only doctors can insert medical records" ON public.medical_records
  FOR INSERT WITH CHECK (clinic_id = public.get_user_clinic() AND public.get_user_role() = 'doctor');

CREATE POLICY "Only doctors can view prescriptions" ON public.prescriptions
  FOR SELECT USING (clinic_id = public.get_user_clinic() AND public.get_user_role() = 'doctor');

CREATE POLICY "Only doctors can insert prescriptions" ON public.prescriptions
  FOR INSERT WITH CHECK (clinic_id = public.get_user_clinic() AND public.get_user_role() = 'doctor');

-- Trigger de nuevo usuario de Autenticación
-- Al registrarse un usuario en supabase (auth.users), no lo pasaremos directo a profil,
-- manejaremos la logica de asginación desde el Backend/Server Actions de Next.js
-- para asegurarnos que se vincule a la clínica correcta según el flujo de subscripción o invitación.
