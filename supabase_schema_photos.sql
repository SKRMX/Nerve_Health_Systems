-- ==============================================================
-- NERVE Health Systems - Migración para Fotos Clínicas
-- ==============================================================

-- 1. Tabla para Registrar los Metadatos de Fotos de Pacientes
CREATE TABLE IF NOT EXISTS public.medical_record_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL, -- Ruta en el bucket: {clinic_id}/{patient_id}/{record_id}/{filename}
    file_name TEXT NOT NULL, -- Nombre original o del archivo
    description TEXT,       -- Notas u observaciones sobre la foto (ej. "Día 1", "Herida en cicatrización")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar Seguridad a Nivel de Fila (Row Level Security)
ALTER TABLE public.medical_record_photos ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de RLS para Aislamiento de Clínicas (Multi-Tenancy)
-- Solo los miembros de la clínica a la que pertenece el registro pueden realizar operaciones (Select, Insert, Delete)
CREATE POLICY "Clinic members can manage photos" 
ON public.medical_record_photos
FOR ALL 
USING (clinic_id = public.get_user_clinic());

-- ==============================================================
-- 4. Instrucciones para Supabase Storage (Ejecutar en Supabase SQL Editor si es necesario)
-- ==============================================================
-- NOTA: Asegúrate de crear el bucket privado 'clinical-attachments' desde la consola de Supabase Storage:
-- 1. Ve a Storage -> New Bucket
-- 2. Nombre del bucket: 'clinical-attachments'
-- 3. Asegúrate de marcar "Public bucket" como DESACTIVADO (debe ser bucket privado).
-- 4. Ejecuta las siguientes políticas en el Editor SQL de Supabase para proteger el almacenamiento:

/*
-- Política de Storage: Permitir leer archivos solo si el doctor pertenece a la clínica de la ruta del archivo
CREATE POLICY "Allow read clinical-attachments if doctor matches clinic"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'clinical-attachments' AND
  (storage.foldername(name))[1]::uuid = (SELECT clinic_id FROM public.users WHERE id = auth.uid() LIMIT 1)
);

-- Política de Storage: Permitir insertar archivos solo si el doctor pertenece a la clínica de la ruta del archivo
CREATE POLICY "Allow insert clinical-attachments if doctor matches clinic"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clinical-attachments' AND
  (storage.foldername(name))[1]::uuid = (SELECT clinic_id FROM public.users WHERE id = auth.uid() LIMIT 1)
);

-- Política de Storage: Permitir eliminar archivos de su clínica
CREATE POLICY "Allow delete clinical-attachments if doctor matches clinic"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'clinical-attachments' AND
  (storage.foldername(name))[1]::uuid = (SELECT clinic_id FROM public.users WHERE id = auth.uid() LIMIT 1)
);
*/
