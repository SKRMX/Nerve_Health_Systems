-- 1. Setup Variables (Wait, SQL variables are tricky with standard psql, I'll use placeholders or just a Do block)
DO $$
DECLARE
    v_user_id uuid := 'f0ce10d1-4d6f-4663-a42d-891f6a0a7d5d';
    v_clinic_id uuid;
    v_patient_ids uuid[];
    i integer;
    v_first_names text[] := ARRAY['Alejandro', 'Sofia', 'Mateo', 'Valentina', 'Santiago', 'Isabella', 'Leonardo', 'Camila', 'Matias', 'Mariana', 'Emiliano', 'Romina', 'Sebastian', 'Renata', 'Diego', 'Victoria', 'Miguel', 'Andrea', 'Juan', 'Valeria'];
    v_last_names text[] := ARRAY['Garcia', 'Martinez', 'Lopez', 'Gonzalez', 'Perez', 'Rodriguez', 'Sanchez', 'Ramirez', 'Cruz', 'Flores', 'Gomez', 'Morales'];
    v_f text;
    v_l text;
    v_patient_id uuid;
    v_now timestamp := now();
BEGIN
    -- 2. Ensure User is Confirmed in auth.users
    UPDATE auth.users SET email_confirmed_at = now(), last_sign_in_at = now() WHERE id = v_user_id;

    -- 3. Create Clinic
    INSERT INTO public.clinics (name, subscription_tier, subscription_status)
    VALUES ('Clínica Médica NERVE', 'clinica', 'active')
    RETURNING id INTO v_clinic_id;

    -- 4. Create Public User entry
    INSERT INTO public.users (id, clinic_id, email, role, first_name, last_name, active)
    VALUES (v_user_id, v_clinic_id, 'demo@nervehealthsystems.com', 'admin', 'Dr.', 'NERVE', true)
    ON CONFLICT (id) DO UPDATE SET clinic_id = EXCLUDED.clinic_id, role = EXCLUDED.role, first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name;

    -- 5. Create Doctor Profile
    INSERT INTO public.doctor_profiles (user_id, full_name, specialty, clinic_name, license_number)
    VALUES (v_user_id, 'Dr. NERVE', 'Medicina General', 'Clínica Médica NERVE', '12345678')
    ON CONFLICT (user_id) DO UPDATE SET full_name = EXCLUDED.full_name, specialty = EXCLUDED.specialty;

    -- 6. Insert 30 Patients
    FOR i IN 1..30 LOOP
        v_f := v_first_names[1 + floor(random() * array_length(v_first_names, 1))];
        v_l := v_last_names[1 + floor(random() * array_length(v_last_names, 1))] || ' ' || v_last_names[1 + floor(random() * array_length(v_last_names, 1))];
        
        INSERT INTO public.patients (clinic_id, first_name, last_name, phone, email, birth_date)
        VALUES (v_clinic_id, v_f, v_l, '+52 55 ' || floor(random() * 9000 + 1000) || ' ' || floor(random() * 9000 + 1000), lower(v_f) || '.' || i || '@test.com', '1980-01-01'::date + (random() * 10000)::integer * '1 day'::interval)
        RETURNING id INTO v_patient_id;
        
        v_patient_ids := array_append(v_patient_ids, v_patient_id);
    END LOOP;

    -- 7. Insert 25 Appointments for the current week
    FOR i IN 1..25 LOOP
        v_patient_id := v_patient_ids[1 + floor(random() * array_length(v_patient_ids, 1))];
        
        INSERT INTO public.appointments (clinic_id, doctor_id, patient_id, title, type, start_time, end_time, status, color_hex)
        VALUES (
            v_clinic_id, 
            v_user_id, 
            v_patient_id, 
            (ARRAY['Consulta General', 'Revision', 'Urgencia', 'Especialidad'])[1 + floor(random() * 4)],
            (ARRAY['presencial', 'video'])[1 + floor(random() * 2)],
            v_now - (extract(dow from v_now)::integer - 1 || ' days')::interval + (floor(random() * 6) || ' days')::interval + (8 + floor(random() * 10) || ' hours')::interval,
            v_now - (extract(dow from v_now)::integer - 1 || ' days')::interval + (floor(random() * 6) || ' days')::interval + (9 + floor(random() * 10) || ' hours')::interval,
            (ARRAY['scheduled', 'completed'])[1 + floor(random() * 2)],
            (ARRAY['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B'])[1 + floor(random() * 4)]
        );
    END LOOP;

    -- 8. Add some medical records for flavor
    FOR i IN 1..5 LOOP
        v_patient_id := v_patient_ids[i];
        INSERT INTO public.medical_records (clinic_id, patient_id, doctor_id, clinical_notes, diagnosis)
        VALUES (v_clinic_id, v_patient_id, v_user_id, 'Paciente presenta cuadro gripal leve. Se receta descanso y abundantes liquidos.', 'Resfriado Comun');
    END LOOP;

END $$;
