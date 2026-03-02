// ============================================================
// NERVE Health Systems — Seed Data
// 4 Hospitales · 14 Departamentos · 50 Médicos · 500+ Pacientes
// ============================================================
(function () {

    // ---- HOSPITALES ----
    const hospitals = [
        { id: 'h1', name: 'Hospital Ángeles Metropolitano', city: 'Ciudad de México', state: 'CDMX', beds: 320, doctors: 20, patients: 248, plan: 'hospital', active: true },
        { id: 'h2', name: 'Centro Médico Nacional de Occidente', city: 'Guadalajara', state: 'Jalisco', beds: 450, doctors: 15, patients: 186, plan: 'hospital', active: true },
        { id: 'h3', name: 'Clínica Santa Fe', city: 'Monterrey', state: 'NL', beds: 180, doctors: 10, patients: 121, plan: 'clinica', active: true },
        { id: 'h4', name: 'Hospital General del Norte', city: 'Chihuahua', state: 'Chihuahua', beds: 220, doctors: 5, patients: 62, plan: 'clinica', active: true },
    ];

    // ---- DEPARTAMENTOS ----
    const departments = [
        { id: 'd1', hospitalId: 'h1', name: 'Cardiología', headId: 'dr_01', doctors: 4, avgRating: 4.85 },
        { id: 'd2', hospitalId: 'h1', name: 'Pediatría', headId: 'dr_06', doctors: 4, avgRating: 4.76 },
        { id: 'd3', hospitalId: 'h1', name: 'Ginecología', headId: 'dr_11', doctors: 4, avgRating: 4.82 },
        { id: 'd4', hospitalId: 'h1', name: 'Neurología', headId: 'dr_15', doctors: 3, avgRating: 4.73 },
        { id: 'd5', hospitalId: 'h1', name: 'Cirugía General', headId: 'dr_19', doctors: 5, avgRating: 4.79 },
        { id: 'd6', hospitalId: 'h2', name: 'Oncología', headId: 'dr_21', doctors: 4, avgRating: 4.91 },
        { id: 'd7', hospitalId: 'h2', name: 'Ortopedia', headId: 'dr_26', doctors: 4, avgRating: 4.68 },
        { id: 'd8', hospitalId: 'h2', name: 'Medicina Interna', headId: 'dr_31', doctors: 4, avgRating: 4.77 },
        { id: 'd9', hospitalId: 'h2', name: 'Urgencias', headId: 'dr_35', doctors: 3, avgRating: 4.81 },
        { id: 'd10', hospitalId: 'h3', name: 'Dermatología', headId: 'dr_38', doctors: 3, avgRating: 4.88 },
        { id: 'd11', hospitalId: 'h3', name: 'Endocrinología', headId: 'dr_42', doctors: 4, avgRating: 4.72 },
        { id: 'd12', hospitalId: 'h3', name: 'Psiquiatría', headId: 'dr_46', doctors: 3, avgRating: 4.80 },
        { id: 'd13', hospitalId: 'h4', name: 'Medicina General', headId: 'dr_49', doctors: 3, avgRating: 4.65 },
        { id: 'd14', hospitalId: 'h4', name: 'Urgencias Norte', headId: 'dr_52', doctors: 2, avgRating: 4.70 },
    ];

    // ---- MÉDICOS (50 total) ----
    const doctors = [
        // ══ Hospital Ángeles Metropolitano (h1) — 20 doctores ══
        // Cardiología (d1)
        { id: 'dr_01', hospitalId: 'h1', deptId: 'd1', role: 'dept_head', gender: 'm', name: 'Dr. Roberto Sánchez García', specialty: 'Cardiología', cedula: '10011001', consults: 14, rating: 4.9, active: true },
        { id: 'dr_02', hospitalId: 'h1', deptId: 'd1', role: 'doctor', gender: 'f', name: 'Dra. Lucía Mendoza Reyes', specialty: 'Cardiología', cedula: '10011002', consults: 11, rating: 4.8, active: true },
        { id: 'dr_03', hospitalId: 'h1', deptId: 'd1', role: 'doctor', gender: 'm', name: 'Dr. Carlos Herrera Vásquez', specialty: 'Cardiología', cedula: '10011003', consults: 9, rating: 4.7, active: true },
        { id: 'dr_04', hospitalId: 'h1', deptId: 'd1', role: 'doctor', gender: 'f', name: 'Dra. Ana Sofía Ramos Cruz', specialty: 'Cardiología', cedula: '10011004', consults: 12, rating: 4.9, active: true },
        // Pediatría (d2)
        { id: 'dr_06', hospitalId: 'h1', deptId: 'd2', role: 'dept_head', gender: 'f', name: 'Dra. Elena Castillo Torres', specialty: 'Pediatría', cedula: '10012001', consults: 16, rating: 5.0, active: true },
        { id: 'dr_07', hospitalId: 'h1', deptId: 'd2', role: 'doctor', gender: 'm', name: 'Dr. Miguel Ángel López Ruiz', specialty: 'Pediatría', cedula: '10012002', consults: 10, rating: 4.6, active: true },
        { id: 'dr_08', hospitalId: 'h1', deptId: 'd2', role: 'doctor', gender: 'f', name: 'Dra. Sofía Jiménez Mora', specialty: 'Pediatría', cedula: '10012003', consults: 8, rating: 4.7, active: true },
        { id: 'dr_09', hospitalId: 'h1', deptId: 'd2', role: 'doctor', gender: 'm', name: 'Dr. Javier Fuentes Álvarez', specialty: 'Pediatría', cedula: '10012004', consults: 13, rating: 4.8, active: true },
        // Ginecología (d3)
        { id: 'dr_11', hospitalId: 'h1', deptId: 'd3', role: 'dept_head', gender: 'f', name: 'Dra. Claudia Vargas León', specialty: 'Ginecología/Obstetricia', cedula: '10013001', consults: 18, rating: 4.9, active: true },
        { id: 'dr_12', hospitalId: 'h1', deptId: 'd3', role: 'doctor', gender: 'm', name: 'Dr. Fernando Morales Peña', specialty: 'Ginecología/Obstetricia', cedula: '10013002', consults: 15, rating: 4.8, active: true },
        { id: 'dr_13', hospitalId: 'h1', deptId: 'd3', role: 'doctor', gender: 'f', name: 'Dra. Patricia Núñez Ibáñez', specialty: 'Ginecología/Obstetricia', cedula: '10013003', consults: 11, rating: 4.7, active: true },
        { id: 'dr_14', hospitalId: 'h1', deptId: 'd3', role: 'doctor', gender: 'f', name: 'Dra. Mariana Solís Aguilar', specialty: 'Ginecología/Obstetricia', cedula: '10013004', consults: 9, rating: 4.6, active: true },
        // Neurología (d4)
        { id: 'dr_15', hospitalId: 'h1', deptId: 'd4', role: 'dept_head', gender: 'm', name: 'Dr. Alejandro Guerrero Solís', specialty: 'Neurología', cedula: '10014001', consults: 10, rating: 4.8, active: true },
        { id: 'dr_16', hospitalId: 'h1', deptId: 'd4', role: 'doctor', gender: 'f', name: 'Dra. Valentina Cruz Espinosa', specialty: 'Neurología', cedula: '10014002', consults: 7, rating: 4.6, active: true },
        { id: 'dr_17', hospitalId: 'h1', deptId: 'd4', role: 'doctor', gender: 'm', name: 'Dr. Samuel Ortega Blanco', specialty: 'Neurología', cedula: '10014003', consults: 9, rating: 4.7, active: true },
        // Cirugía General (d5)
        { id: 'dr_19', hospitalId: 'h1', deptId: 'd5', role: 'dept_head', gender: 'm', name: 'Dr. Héctor Domínguez Ríos', specialty: 'Cirugía General', cedula: '10015001', consults: 12, rating: 4.9, active: true },
        { id: 'dr_20', hospitalId: 'h1', deptId: 'd5', role: 'doctor', gender: 'f', name: 'Dra. Daniela Reyes Montes', specialty: 'Cirugía General', cedula: '10015002', consults: 8, rating: 4.7, active: true },
        { id: 'dr_21a', hospitalId: 'h1', deptId: 'd5', role: 'doctor', gender: 'm', name: 'Dr. Gerardo Salinas Ponce', specialty: 'Cirugía General', cedula: '10015003', consults: 11, rating: 4.8, active: true },
        { id: 'dr_22', hospitalId: 'h1', deptId: 'd5', role: 'doctor', gender: 'f', name: 'Dra. Renata Ibarra Quiroz', specialty: 'Cirugía Laparoscópica', cedula: '10015004', consults: 9, rating: 4.6, active: true },
        { id: 'dr_23', hospitalId: 'h1', deptId: 'd5', role: 'doctor', gender: 'm', name: 'Dr. Luis Alberto Flores Soto', specialty: 'Cirugía Oncológica', cedula: '10015005', consults: 6, rating: 4.8, active: true },

        // ══ Centro Médico Nacional de Occidente (h2) — 15 doctores ══
        // Oncología (d6)
        { id: 'dr_21', hospitalId: 'h2', deptId: 'd6', role: 'dept_head', gender: 'f', name: 'Dra. Gabriela Montoya Fuentes', specialty: 'Oncología Médica', cedula: '20011001', consults: 14, rating: 4.9, active: true },
        { id: 'dr_24', hospitalId: 'h2', deptId: 'd6', role: 'doctor', gender: 'm', name: 'Dr. Ricardo Pedraza Ávila', specialty: 'Oncología Médica', cedula: '20011002', consults: 11, rating: 4.8, active: true },
        { id: 'dr_25', hospitalId: 'h2', deptId: 'd6', role: 'doctor', gender: 'f', name: 'Dra. Noemí Castellanos Vega', specialty: 'Oncología Radioterapia', cedula: '20011003', consults: 9, rating: 4.9, active: true },
        { id: 'dr_254', hospitalId: 'h2', deptId: 'd6', role: 'doctor', gender: 'm', name: 'Dr. Armando Leal Preciado', specialty: 'Hematología/Oncología', cedula: '20011004', consults: 12, rating: 4.7, active: true },
        // Ortopedia (d7)
        { id: 'dr_26', hospitalId: 'h2', deptId: 'd7', role: 'dept_head', gender: 'm', name: 'Dr. Jorge Acosta Mejía', specialty: 'Ortopedia y Traumatología', cedula: '20012001', consults: 15, rating: 4.7, active: true },
        { id: 'dr_27', hospitalId: 'h2', deptId: 'd7', role: 'doctor', gender: 'm', name: 'Dr. Ernesto Bautista Lara', specialty: 'Ortopedia y Traumatología', cedula: '20012002', consults: 10, rating: 4.6, active: true },
        { id: 'dr_28', hospitalId: 'h2', deptId: 'd7', role: 'doctor', gender: 'f', name: 'Dra. Isabel Guzmán Parra', specialty: 'Ortopedia Pediátrica', cedula: '20012003', consults: 8, rating: 4.8, active: true },
        { id: 'dr_29', hospitalId: 'h2', deptId: 'd7', role: 'doctor', gender: 'm', name: 'Dr. Tomás Espinoza Delgado', specialty: 'Columna Vertebral', cedula: '20012004', consults: 11, rating: 4.5, active: true },
        // Medicina Interna (d8)
        { id: 'dr_31', hospitalId: 'h2', deptId: 'd8', role: 'dept_head', gender: 'f', name: 'Dra. Carmen Alvarado Nava', specialty: 'Medicina Interna', cedula: '20013001', consults: 13, rating: 4.8, active: true },
        { id: 'dr_32', hospitalId: 'h2', deptId: 'd8', role: 'doctor', gender: 'm', name: 'Dr. Rafael Mendez Orozco', specialty: 'Medicina Interna', cedula: '20013002', consults: 9, rating: 4.7, active: true },
        { id: 'dr_33', hospitalId: 'h2', deptId: 'd8', role: 'doctor', gender: 'f', name: 'Dra. Beatriz Ponce Gallardo', specialty: 'Reumatología', cedula: '20013003', consults: 11, rating: 4.6, active: true },
        { id: 'dr_34', hospitalId: 'h2', deptId: 'd8', role: 'doctor', gender: 'm', name: 'Dr. Hugo Serrano Castro', specialty: 'Neumología', cedula: '20013004', consults: 7, rating: 4.9, active: true },
        // Urgencias (d9)
        { id: 'dr_35', hospitalId: 'h2', deptId: 'd9', role: 'dept_head', gender: 'm', name: 'Dr. Oswaldo Bravo Nieto', specialty: 'Urgencias / Emergencias', cedula: '20014001', consults: 22, rating: 4.8, active: true },
        { id: 'dr_36', hospitalId: 'h2', deptId: 'd9', role: 'doctor', gender: 'f', name: 'Dra. Lorena Hidalgo Carrillo', specialty: 'Urgencias / Emergencias', cedula: '20014002', consults: 19, rating: 4.7, active: true },
        { id: 'dr_37', hospitalId: 'h2', deptId: 'd9', role: 'doctor', gender: 'm', name: 'Dr. Mario Pacheco Trejo', specialty: 'Urgencias / Emergencias', cedula: '20014003', consults: 21, rating: 4.9, active: true },

        // ══ Clínica Santa Fe (h3) — 10 doctores ══
        // Dermatología (d10)
        { id: 'dr_38', hospitalId: 'h3', deptId: 'd10', role: 'dept_head', gender: 'f', name: 'Dra. Natalia Ríos Sandoval', specialty: 'Dermatología', cedula: '30011001', consults: 12, rating: 4.9, active: true },
        { id: 'dr_39', hospitalId: 'h3', deptId: 'd10', role: 'doctor', gender: 'm', name: 'Dr. Pablo Cisneros Leal', specialty: 'Dermatología', cedula: '30011002', consults: 9, rating: 4.7, active: true },
        { id: 'dr_40', hospitalId: 'h3', deptId: 'd10', role: 'doctor', gender: 'f', name: 'Dra. Andrea Márquez Dávila', specialty: 'Dermatología Cosmética', cedula: '30011003', consults: 11, rating: 4.8, active: true },
        // Endocrinología (d11)
        { id: 'dr_42', hospitalId: 'h3', deptId: 'd11', role: 'dept_head', gender: 'm', name: 'Dr. Víctor Manuel Rueda Lagos', specialty: 'Endocrinología', cedula: '30012001', consults: 10, rating: 4.7, active: true },
        { id: 'dr_43', hospitalId: 'h3', deptId: 'd11', role: 'doctor', gender: 'f', name: 'Dra. Cecilia Tapia Monreal', specialty: 'Endocrinología', cedula: '30012002', consults: 8, rating: 4.6, active: true },
        { id: 'dr_44', hospitalId: 'h3', deptId: 'd11', role: 'doctor', gender: 'm', name: 'Dr. Gustavo Navarrete Pozos', specialty: 'Diabetología', cedula: '30012003', consults: 12, rating: 4.8, active: true },
        { id: 'dr_45', hospitalId: 'h3', deptId: 'd11', role: 'doctor', gender: 'f', name: 'Dra. Mireya Delgadillo Ochoa', specialty: 'Tiroides y Metabolismo', cedula: '30012004', consults: 7, rating: 4.5, active: true },
        // Psiquiatría (d12)
        { id: 'dr_46', hospitalId: 'h3', deptId: 'd12', role: 'dept_head', gender: 'f', name: 'Dra. Pilar Gutiérrez Amaro', specialty: 'Psiquiatría', cedula: '30013001', consults: 8, rating: 4.9, active: true },
        { id: 'dr_47', hospitalId: 'h3', deptId: 'd12', role: 'doctor', gender: 'm', name: 'Dr. Aurelio Vázquez Serna', specialty: 'Psiquiatría', cedula: '30013002', consults: 6, rating: 4.8, active: true },
        { id: 'dr_48', hospitalId: 'h3', deptId: 'd12', role: 'doctor', gender: 'f', name: 'Dra. Esther Lozano Campos', specialty: 'Psicología Clínica', cedula: '30013003', consults: 9, rating: 4.7, active: true },

        // ══ Hospital General del Norte (h4) — 5 doctores ══
        // Medicina General (d13)
        { id: 'dr_49', hospitalId: 'h4', deptId: 'd13', role: 'dept_head', gender: 'm', name: 'Dr. Benjamín Rojo Estrada', specialty: 'Medicina Familiar', cedula: '40011001', consults: 18, rating: 4.6, active: true },
        { id: 'dr_50', hospitalId: 'h4', deptId: 'd13', role: 'doctor', gender: 'f', name: 'Dra. Yolanda Pérez Muñiz', specialty: 'Medicina Familiar', cedula: '40011002', consults: 14, rating: 4.5, active: true },
        { id: 'dr_51', hospitalId: 'h4', deptId: 'd13', role: 'doctor', gender: 'm', name: 'Dr. Emmanuel Chávez Díaz', specialty: 'Medicina General', cedula: '40011003', consults: 11, rating: 4.7, active: true },
        // Urgencias Norte (d14)
        { id: 'dr_52', hospitalId: 'h4', deptId: 'd14', role: 'dept_head', gender: 'f', name: 'Dra. Karina Juárez Portillo', specialty: 'Urgencias / Emergencias', cedula: '40012001', consults: 24, rating: 4.8, active: true },
        { id: 'dr_53', hospitalId: 'h4', deptId: 'd14', role: 'doctor', gender: 'm', name: 'Dr. Rodrigo Andrade Salazar', specialty: 'Urgencias / Emergencias', cedula: '40012002', consults: 20, rating: 4.6, active: true },
    ];

    // ---- GENERADOR DE PACIENTES ----
    const firstNames = {
        f: ['María', 'Ana', 'Laura', 'Sofía', 'Valentina', 'Carmen', 'Gabriela', 'Patricia', 'Fernanda', 'Isabel', 'Adriana', 'Claudia', 'Diana', 'Mónica', 'Beatriz', 'Rosa', 'Alicia', 'Susana', 'Verónica', 'Leticia', 'Sandra', 'Alejandra', 'Cecilia', 'Margarita', 'Norma'],
        m: ['José', 'Juan', 'Carlos', 'Luis', 'Miguel', 'Roberto', 'Francisco', 'Antonio', 'Eduardo', 'Ricardo', 'Jorge', 'Alejandro', 'Manuel', 'Fernando', 'Alberto', 'Daniel', 'Sergio', 'Raúl', 'Óscar', 'Javier', 'Héctor', 'Andrés', 'Arturo', 'Enrique', 'Pablo'],
    };
    const lastNames = ['García', 'Martínez', 'López', 'González', 'Hernández', 'Ramírez', 'Torres', 'Flores', 'Pérez', 'Díaz', 'Rivera', 'Sánchez', 'Morales', 'Romero', 'Cruz', 'Reyes', 'Vega', 'Jiménez', 'Navarro', 'Ruiz', 'Castillo', 'Moreno', 'Gómez', 'Méndez', 'Muñoz', 'Guerrero', 'Ramos', 'Salinas', 'Ortega', 'Ávila'];
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const diagnoses = {
        'Cardiología': ['Hipertensión arterial', 'Insuficiencia cardíaca', 'Fibrilación auricular', 'Angina inestable', 'Cardiopatía isquémica'],
        'Pediatría': ['Infección respiratoria aguda', 'Otitis media', 'Asma bronquial', 'Gastroenteritis aguda', 'Varicela'],
        'Ginecología/Obstetricia': ['Control prenatal', 'Endometriosis', 'Mioma uterino', 'SOP - Síndrome de ovario poliquístico', 'Embarazo de alto riesgo'],
        'Neurología': ['Migraña crónica', 'Epilepsia focal', 'Esclerosis múltiple', 'Parkinson incipiente', 'Neuropatía periférica'],
        'Cirugía General': ['Hernia inguinal', 'Apendicitis aguda', 'Colecistitis crónica', 'Obstrucción intestinal', 'Hemorroides grado III'],
        'Oncología Médica': ['Ca. de mama estadio II', 'Ca. colorrectal', 'Linfoma no Hodgkin', 'Ca. de pulmón', 'Leucemia mieloide crónica'],
        'Ortopedia y Traumatología': ['Fractura de cadera', 'Artrosis de rodilla', 'Lesión de ligamento cruzado', 'Hernia discal lumbar', 'Pseudoartrosis'],
        'Medicina Interna': ['DM2 descompensada', 'Síndrome metabólico', 'Anemia ferropénica', 'Hepatitis crónica', 'EPOC moderado'],
        'Urgencias / Emergencias': ['Trauma craneoencefálico leve', 'IAM - Infarto agudo al miocardio', 'Crisis hipertensiva', 'Sepsis de foco urinario', 'Politrauma'],
        'Dermatología': ['Psoriasis en placas', 'Dermatitis atópica', 'Acné quístico', 'Melanoma in situ', 'Vitiligo'],
        'Endocrinología': ['Hipotiroidismo', 'Diabetes tipo 1', 'Diabetes tipo 2', 'Hiperparatiroidismo', 'Síndrome de Cushing'],
        'Psiquiatría': ['Trastorno depresivo mayor', 'Trastorno de ansiedad generalizada', 'Trastorno bipolar I', 'TDAH en adultos', 'Trastorno de pánico'],
        'Medicina Familiar': ['Hipertensión esencial', 'Diabetes mellitus 2', 'Obesidad grado I', 'Dislipidemia mixta', 'Control de adulto sano'],
        'default': ['Seguimiento general', 'Control crónico', 'Evaluación de nuevo ingreso', 'Estudio de caso complejo', 'Revisión post-operatoria'],
    };

    let _patientId = 1;
    function seedInt(min, max, salt) {
        return min + ((salt * 6271 + 1783) % (max - min + 1));
    }
    function rndItem(arr, salt) { return arr[Math.abs(salt * 3 + 7) % arr.length]; }

    function generatePatients(doctor, count) {
        const pts = [];
        const dx = diagnoses[doctor.specialty] || diagnoses.default;
        for (let i = 0; i < count; i++) {
            const salt = _patientId * 97 + i * 31;
            const isFem = (salt % 3 !== 0);
            const fnArr = isFem ? firstNames.f : firstNames.m;
            const fn = rndItem(fnArr, salt);
            const ln1 = rndItem(lastNames, salt + 1);
            const ln2 = rndItem(lastNames, salt + 2);
            const age = 18 + (salt % 65);
            const id = `pat_${String(_patientId).padStart(4, '0')}`;
            _patientId++;
            pts.push({
                id,
                doctorId: doctor.id,
                hospitalId: doctor.hospitalId,
                deptId: doctor.deptId,
                name: `${fn} ${ln1} ${ln2}`,
                gender: isFem ? 'f' : 'm',
                age,
                dob: `${1960 + (salt % 48)}-${String(1 + (salt % 12)).padStart(2, '0')}-${String(1 + (salt % 28)).padStart(2, '0')}`,
                blood: rndItem(bloodTypes, salt + 5),
                phone: `+52 55 ${1000 + (salt % 9000)} ${1000 + ((salt * 3) % 9000)}`,
                email: `${fn.toLowerCase().replace(/ /g, '')}.${ln1.toLowerCase()}@email.com`,
                diagnosis: rndItem(dx, salt + 3),
                status: ['Activo', 'Activo', 'Activo', 'Seguimiento', 'Nuevo'][salt % 5],
                visits: 1 + (salt % 18),
                lastVisit: `2026-02-${String(1 + (salt % 27)).padStart(2, '0')}`,
                allergies: (salt % 4 === 0) ? ['Penicilina', 'AINES', 'Sulfamidas', 'Látex'][salt % 4] : 'Ninguna conocida',
                weight: 50 + (salt % 60),
                height: 150 + (salt % 40),
                bp: `${110 + (salt % 40)}/${70 + (salt % 22)}`,
                notes: `Paciente con ${rndItem(dx, salt + 4).toLowerCase()} en seguimiento regular.`,
            });
        }
        return pts;
    }

    // ---- Generar todos los pacientes ----
    const patients = doctors.flatMap(d => {
        const salt = d.id.charCodeAt(d.id.length - 1);
        const count = 10 + (salt % 6); // 10–15 pacientes por doctor
        return generatePatients(d, count);
    });

    // ---- CITAS (últimas 30 días, para dashboards) ----
    const appointmentTypes = ['Consulta general', 'Primera vez', 'Seguimiento', 'Pre-operatorio', 'Post-operatorio', 'Urgencia', 'Control crónico'];
    const appointmentStatuses = ['confirmada', 'confirmada', 'confirmada', 'pendiente', 'cancelada'];
    const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
    const rooms = ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4', 'Consultorio 5', 'Consultorio 6', 'Consultorio A', 'QB-1'];

    const appointments = [];
    let _apptId = 1;
    doctors.forEach(doc => {
        const pts = patients.filter(p => p.doctorId === doc.id);
        const count = Math.min(pts.length, doc.consults);
        for (let i = 0; i < count; i++) {
            const pat = pts[i % pts.length];
            const salt = _apptId * 53 + i * 17;
            const day = 1 + (salt % 27);
            appointments.push({
                id: `appt_${_apptId++}`,
                doctorId: doc.id,
                patientId: pat.id,
                patientName: pat.name,
                hospitalId: doc.hospitalId,
                deptId: doc.deptId,
                date: `2026-02-${String(day).padStart(2, '0')}`,
                time: rndItem(times, salt),
                room: rndItem(rooms, salt + 1),
                type: rndItem(appointmentTypes, salt + 2),
                status: rndItem(appointmentStatuses, salt + 3),
                notes: '',
            });
        }
    });

    // ---- RECETAS (muestra) ----
    const medications = [
        'Enalapril 10mg', 'Metformina 850mg', 'Atorvastatina 40mg', 'Losartán 50mg', 'Omeprazol 20mg',
        'Amoxicilina 500mg', 'Ibuprofeno 400mg', 'Metoprolol 25mg', 'Levotiroxina 100mcg', 'Amlodipino 5mg',
        'Espironolactona 25mg', 'Furosemida 40mg', 'Insulina Glargina 10UI', 'Prednisona 5mg', 'Paracetamol 500mg',
    ];
    const prescriptions = [];
    let _rxId = 1;
    patients.slice(0, 200).forEach((pat, i) => {
        const salt = i * 71 + 13;
        const doc = doctors.find(d => d.id === pat.doctorId);
        if (!doc) return;
        prescriptions.push({
            id: `rx_${String(_rxId++).padStart(4, '0')}`,
            doctorId: doc.id,
            doctorName: doc.name,
            patientId: pat.id,
            patientName: pat.name,
            hospitalId: doc.hospitalId,
            date: `2026-02-${String(1 + (salt % 27)).padStart(2, '0')}`,
            diagnosis: pat.diagnosis,
            medications: [
                { name: rndItem(medications, salt), dose: '1 tableta', freq: 'Cada 12 hrs', days: 30 },
                ...(salt % 2 === 0 ? [{ name: rndItem(medications, salt + 5), dose: '1 tableta', freq: 'Cada 8 hrs', days: 7 }] : []),
            ],
            status: ['activa', 'activa', 'activa', 'vencida'][salt % 4],
            downloaded: salt % 3 === 0,
        });
    });

    // ---- MÉTRICAS GLOBALES (para Super Admin) ----
    const globalMetrics = {
        totalOrgs: 4,
        totalDoctors: 50,
        totalPatients: patients.length,
        totalAppts: appointments.length,
        mrr: 52400,   // MXN mensual
        arr: 628800,
        activeSubscriptions: 4,
        newOrgsThisMonth: 0,
        uptime: 99.97,
        satisfaction: 4.79,
        monthlyRevenue: [38000, 41000, 44000, 47000, 50000, 52400],
        revenueLabels: ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'],
    };

    // ---- EXPONER DATOS ----
    window.NERVE_DATA = {
        hospitals,
        departments,
        doctors,
        patients,
        appointments,
        prescriptions,
        globalMetrics,

        // ---- Helpers ----
        getHospital: id => hospitals.find(h => h.id === id),
        getDept: id => departments.find(d => d.id === id),
        getDoctor: id => doctors.find(d => d.id === id),
        getDoctorsByHospital: hId => doctors.filter(d => d.hospitalId === hId),
        getDoctorsByDept: dId => doctors.filter(d => d.deptId === dId),
        getPatientsByDoctor: drId => patients.filter(p => p.doctorId === drId),
        getPatientsByDept: dId => patients.filter(p => p.deptId === dId),
        getPatientsByHospital: hId => patients.filter(p => p.hospitalId === hId),
        getApptsByDoctor: drId => appointments.filter(a => a.doctorId === drId),
        getApptsByDept: dId => appointments.filter(a => a.deptId === dId),
        getApptsByHospital: hId => appointments.filter(a => a.hospitalId === hId),
        getRxByDoctor: drId => prescriptions.filter(r => r.doctorId === drId),

        // Demo current users (mapped to APP.currentUser roles)
        currentUsers: {
            superadmin: null,               // uses globalMetrics
            org_owner: 'h1',               // Hospital Ángeles Metropolitano
            dept_head: 'dr_01',            // Dr. Sánchez — Jefe de Cardiología
            doctor: 'dr_06',            // Dra. Castillo — Pediatría
            patient: 'pat_0001',         // First patient
        },
    };

    console.log(`[NERVE SEED] Loaded: ${hospitals.length} hospitals, ${doctors.length} doctors, ${patients.length} patients, ${appointments.length} appointments, ${prescriptions.length} prescriptions.`);
})();
