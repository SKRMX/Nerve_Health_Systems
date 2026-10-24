import { NextResponse } from "next/server";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";

const MEXICAN_FIRST_NAMES = [
  "Alejandro", "Sofía", "Mateo", "Valentina", "Santiago", "Isabella",
  "Leonardo", "Camila", "Matías", "Mariana", "Emiliano", "Romina",
  "Sebastián", "Renata", "Diego", "Victoria", "Miguel", "Andrea"
];

const MEXICAN_LAST_NAMES = [
  "García", "Martínez", "López", "González", "Pérez", "Rodríguez",
  "Sánchez", "Ramírez", "Cruz", "Flores", "Gómez", "Morales"
];

const GENERAL_MEDICINE_NOTES = [
  { diagnosis: "Faringoamigdalitis Aguda", notes: "Paciente refiere dolor de garganta y fiebre de 38.5C. Hiperemia faríngea con exudado purulento. Se indica tratamiento antibiótico y analgésico." },
  { diagnosis: "Rinitis Alérgica", notes: "Prurito nasal, estornudos frecuentes y rinorrea hialina. Antecedentes de alergia estacional. Se receta antihistamínico y lavado nasal." },
  { diagnosis: "Gastroenteritis Infecciosa", notes: "Evacuaciones disminuidas de consistencia, náuseas y dolor abdominal tipo cólico. Deshidratación leve. Dieta blanda y electrolitos orales." },
  { diagnosis: "Hipertensión Arterial Sistémica (Control)", notes: "Control de rutina. TA: 135/85 mmHg. Paciente refiere buena adherencia al tratamiento. Se solicita perfil de lípidos y glucosa." },
  { diagnosis: "Lumbalgia Mecánica", notes: "Dolor en región lumbar tras cargar objeto pesado. Limitación funcional leve. Se indica reposo relativo y AINES." },
  { diagnosis: "Infección de Vías Urinarias", notes: "Disuria, polaquiuria y tenesmo vesical. Puño percusión renal negativa. Se solicita EGO y se inicia tratamiento empírico." },
  { diagnosis: "Cefalea Tensional", notes: "Cefalea opresiva holocraneal de intensidad moderada. Relacionada con estrés laboral. Exploración neurológica normal. Manejo con analgésicos." }
];

function getRandomMexicanName() {
  const fName = MEXICAN_FIRST_NAMES[Math.floor(Math.random() * MEXICAN_FIRST_NAMES.length)];
  const lName1 = MEXICAN_LAST_NAMES[Math.floor(Math.random() * MEXICAN_LAST_NAMES.length)];
  const lName2 = MEXICAN_LAST_NAMES[Math.floor(Math.random() * MEXICAN_LAST_NAMES.length)];
  return { first_name: fName, last_name: `${lName1} ${lName2}` };
}

function getRandomPhone() {
  return `+52 ${Math.floor(Math.random() * 900 + 100)} ${Math.floor(Math.random() * 9000000 + 1000000)}`;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No has iniciado sesión" }, { status: 401 });
    }

    const doctorId = session.user.id;

    // 1. Get existing user profile. 
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('clinic_id')
      .eq('id', doctorId)
      .maybeSingle();

    if (!userProfile || !userProfile.clinic_id) {
      return NextResponse.json({ 
        error: "Perfil incompleto. Por favor registra tu clínica primero en la página de registro." 
      }, { status: 400 });
    }

    const clinicId = userProfile.clinic_id;

    // Update clinic and doctor name for the demo
    await supabase.from('clinics').update({ name: 'Clínica Médica NERVE' }).eq('id', clinicId);
    await supabase.from('users').update({ first_name: "Dr.", last_name: "NERVE" }).eq('id', doctorId);
    
    // Update or Create doctor profile
    await supabase.from('doctor_profiles').upsert({ 
      user_id: doctorId,
      full_name: "Dr. NERVE",
      specialty: "Medicina General",
      license_number: "740291-DEMO",
      university: "Universidad Nacional de Medicina",
      clinic_name: "Clínica Médica NERVE",
      clinic_address: "Av. Salud Digital 101, Ciudad de México",
      clinic_phone: "+52 55 1234 5678",
      footer_text: "NERVE Health Systems - Software de Gestión Médica"
    });

    // 2. Generate 30 Patients
    const patientsToInsert = [];
    for (let i = 0; i < 30; i++) {
      const { first_name, last_name } = getRandomMexicanName();
      patientsToInsert.push({
        clinic_id: clinicId,
        first_name,
        last_name,
        phone: getRandomPhone(),
        email: `${first_name.toLowerCase()}.${last_name.split(' ')[0].toLowerCase()}.${i}@ejemplo.com`,
        birth_date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365 * 45).toISOString().split('T')[0]
      });
    }

    const { data: insertedPatients, error: pErr } = await supabase.from('patients').insert(patientsToInsert).select();
    if (pErr) throw pErr;

    // 3. Generate 1 Medical Record for each patient
    const recordsToInsert = insertedPatients.map(p => {
      const noteData = GENERAL_MEDICINE_NOTES[Math.floor(Math.random() * GENERAL_MEDICINE_NOTES.length)];
      return {
        clinic_id: clinicId,
        patient_id: p.id,
        doctor_id: doctorId,
        diagnosis: noteData.diagnosis,
        clinical_notes: noteData.notes,
        created_at: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString() // Past month
      };
    });

    const { error: rErr } = await supabase.from('medical_records').insert(recordsToInsert);
    if (rErr) throw rErr;

    // 4. Generate 20 Appointments
    const appointmentsToInsert = [];
    const statuses = ['scheduled', 'completed', 'scheduled', 'scheduled']; 
    const types = ['Consulta General', 'Revisión', 'Urgencia', 'Control'];
    const colors = ['#0d9488', '#8b5cf6', '#3b82f6'];

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(8, 0, 0, 0);

    for (let i = 0; i < 20; i++) {
        const patient = insertedPatients[Math.floor(Math.random() * insertedPatients.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const type = types[Math.floor(Math.random() * types.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        const randomDayOffset = Math.floor(Math.random() * 6); // Mon-Sat
        const randomHour = Math.floor(Math.random() * 8) + 9;
        
        const startTime = new Date(startOfWeek);
        startTime.setDate(startTime.getDate() + randomDayOffset);
        startTime.setHours(randomHour, 0, 0, 0);
        
        const durationMin = Math.random() > 0.5 ? 30 : 60;
        const endTime = new Date(startTime.getTime() + durationMin * 60000);
        
        appointmentsToInsert.push({
          clinic_id: clinicId,
          doctor_id: doctorId,
          patient_id: patient.id,
          title: type,
          type: type,
          color_hex: color,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: status
        });
    }

    const { error: aErr } = await supabase.from('appointments').insert(appointmentsToInsert);
    if (aErr) throw aErr;

    return NextResponse.json({ success: true, message: "Dr. NERVE Seeding Complete (with records)" });

  } catch (error: any) {
    console.error("Seed Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
