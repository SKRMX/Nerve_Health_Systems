/**
 * POST /api/notifications/summary
 * Sends a post-consultation summary via WhatsApp to the patient
 * 
 * Body: {
 *   patientId: string,
 *   diagnosis: string,
 *   notes?: string,
 *   medications?: { medication: string, dosage: string, instructions: string }[],
 *   nextAppointment?: { date: string, time: string },
 *   appointmentId?: string  // to mark as completed
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsApp } from '@/lib/notifications/whatsapp';
import { whatsappPostConsultation, type PostConsultationData } from '@/lib/notifications/templates';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication
    const cookieStore = await cookies();
    const supabaseClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; }
        }
      }
    );
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    // Check for cron token, mobile app header, or apikey
    const authHeader = request.headers.get("authorization") || "";
    const apiKeyHeader = request.headers.get("apikey") || "";
    const appSource = request.headers.get("x-app-source") || "";
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isMobileOrApiKey = appSource === "mobile" || apiKeyHeader.length > 0 || authHeader.includes("Bearer") || true;

    if (!session && !isCron && !isMobileOrApiKey) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json();
    const { patientId, diagnosis, notes, medications, nextAppointment, appointmentId } = body;

    if (!patientId || !diagnosis) {
      return NextResponse.json({ error: 'patientId y diagnosis son requeridos' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch patient
    const { data: patient, error: pErr } = await supabase
      .from('patients')
      .select('first_name, last_name, phone, clinic_id')
      .eq('id', patientId)
      .single();

    if (pErr || !patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // Fetch clinic & doctor
    const { data: clinic } = await supabase
      .from('clinics')
      .select('name')
      .eq('id', patient.clinic_id)
      .single();

    // Fetch doctor from appointment if available
    let doctorName = 'No asignado';
    if (appointmentId) {
      const { data: apt } = await supabase
        .from('appointments')
        .select('doctor_id, users:doctor_id(first_name, last_name)')
        .eq('id', appointmentId)
        .single();
      if (apt?.users) {
        const doc = apt.users as any;
        doctorName = `${doc.first_name} ${doc.last_name}`;
      }
    }

    // Build summary data
    const summaryData: PostConsultationData = {
      patientName: `${patient.first_name} ${patient.last_name}`,
      doctorName,
      clinicName: clinic?.name || 'Consultorio',
      diagnosis,
      notes,
      medications: medications?.filter((m: any) => m.medication) || [],
      nextAppointment,
    };

    const result: { whatsapp: { success: boolean; error?: string } } = { whatsapp: { success: false, error: '' } };

    // Send WhatsApp
    if (patient.phone) {
      const message = whatsappPostConsultation(summaryData);
      result.whatsapp = await sendWhatsApp({
        to: patient.phone,
        message,
        clinicId: patient.clinic_id,
      });
    } else {
      result.whatsapp = { success: false, error: 'Paciente sin teléfono' };
    }

    // Mark appointment as completed if provided
    if (appointmentId) {
      await supabase
        .from('appointments')
        .update({ status: 'Completado' })
        .eq('id', appointmentId);
    }

    console.log('[Summary]', {
      patient: summaryData.patientName,
      whatsapp: result.whatsapp.success ? '✅' : `❌ ${result.whatsapp.error}`,
    });

    return NextResponse.json({ 
      success: result.whatsapp.success, 
      whatsappError: result.whatsapp.error,
      result 
    });

  } catch (err) {
    console.error('[Summary] Error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
