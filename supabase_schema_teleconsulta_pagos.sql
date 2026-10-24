-- ================================================================
-- Migration: Teleconsultas, Pagos Integrados y Control de Almacén
-- ================================================================

-- 1. Alterar tabla doctor_profiles
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS teleconsulta_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS teleconsulta_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS payment_required BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS mp_client_id TEXT,
ADD COLUMN IF NOT EXISTS mp_access_token TEXT,
ADD COLUMN IF NOT EXISTS mp_refresh_token TEXT;

-- 2. Alterar tabla appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_type TEXT NOT NULL DEFAULT 'presencial' CHECK (appointment_type IN ('presencial', 'teleconsulta')),
ADD COLUMN IF NOT EXISTS teleconsulta_url TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'no_requerido' CHECK (payment_status IN ('no_requerido', 'pendiente', 'pagado', 'fallido')),
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- 3. Crear tabla public.inventory_items
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sku TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_stock_alert INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en inventory_items
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para inventory_items
DROP POLICY IF EXISTS "Allow clinic access on inventory_items" ON public.inventory_items;
CREATE POLICY "Allow clinic access on inventory_items" ON public.inventory_items
    USING (clinic_id = public.get_user_clinic())
    WITH CHECK (clinic_id = public.get_user_clinic());

-- 4. Crear tabla public.appointment_sales
CREATE TABLE IF NOT EXISTS public.appointment_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    sale_price_at_time NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en appointment_sales
ALTER TABLE public.appointment_sales ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para appointment_sales
DROP POLICY IF EXISTS "Allow clinic access on appointment_sales" ON public.appointment_sales;
CREATE POLICY "Allow clinic access on appointment_sales" ON public.appointment_sales
    USING (clinic_id = public.get_user_clinic())
    WITH CHECK (clinic_id = public.get_user_clinic());

-- 5. Crear tabla public.clinic_expenses
CREATE TABLE IF NOT EXISTS public.clinic_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    concept TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en clinic_expenses
ALTER TABLE public.clinic_expenses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para clinic_expenses
DROP POLICY IF EXISTS "Allow clinic access on clinic_expenses" ON public.clinic_expenses;
CREATE POLICY "Allow clinic access on clinic_expenses" ON public.clinic_expenses
    USING (clinic_id = public.get_user_clinic())
    WITH CHECK (clinic_id = public.get_user_clinic());
