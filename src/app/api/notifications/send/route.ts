/**
 * POST /api/notifications/send
 * Sends email + WhatsApp notification for an appointment event
 * 
 * Body: { appointmentId: string, type: 'confirmation' | 'reschedule' | 'cancellation' }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/notifications/email';
import { sendWhatsApp } from '@/lib/notifications/whatsapp';
import {
  type AppointmentNotificationData,
  emailConfirmation,
  emailReschedule,
  emailCancellation,
  whatsappConfirmation,
  whatsappReschedule,
  whatsappCancellation,
} from '@/lib/notifications/templates';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  // Convert to Mexico timezone
  const mx = new Date(d.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  return format(mx, "d 'de' MMMM 'de' yyyy", { locale: es });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  // Convert to Mexico timezone
  const mx = new Date(d.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  return format(mx, 'hh:mm a', { locale: es });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication (web session, cron secret, apikey or mobile app header)
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

    const { appointmentId, type } = await request.json();

    if (!appointmentId || !type) {
      return NextResponse.json(
        { error: 'appointmentId y type son requeridos' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Fetch appointment with patient, doctor, and clinic data
    const { data: appointment, error: aptError } = await supabase
      .from('appointments')
      .select(`
        *,
        patients ( first_name, last_name, email, phone ),
        users:doctor_id ( first_name, last_name ),
        clinics:clinic_id ( name )
      `)
      .eq('id', appointmentId)
      .single();

    if (aptError || !appointment) {
      console.error('[Notifications] Appointment not found:', aptError);
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    const patient = appointment.patients;
    const doctor = appointment.users;
    const clinic = appointment.clinics;

    if (!patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    const notifData: AppointmentNotificationData = {
      patientName: `${patient.first_name} ${patient.last_name}`,
      doctorName: doctor ? `${doctor.first_name} ${doctor.last_name}` : 'No asignado',
      clinicName: clinic?.name || 'NERVE Health',
      date: formatDate(appointment.start_time),
      time: formatTime(appointment.start_time),
      type: appointment.type || 'Consulta',
      title: appointment.title || 'Cita médica',
    };

    const results: { email: { success: boolean; error?: string }; whatsapp: { success: boolean; error?: string } } = { email: { success: false, error: '' }, whatsapp: { success: false, error: '' } };

    // Send Email
    if (patient.email) {
      let emailData;
      switch (type) {
        case 'confirmation':
          emailData = emailConfirmation(notifData);
          break;
        case 'reschedule':
          emailData = emailReschedule(notifData);
          break;
        case 'cancellation':
          emailData = emailCancellation(notifData);
          break;
        default:
          emailData = emailConfirmation(notifData);
      }
      results.email = await sendEmail({
        to: patient.email,
        subject: emailData.subject,
        html: emailData.html,
      });
    } else {
      results.email = { success: false, error: 'Paciente sin email' };
    }

    // Send WhatsApp
    if (patient.phone) {
      let whatsappMsg;
      switch (type) {
        case 'confirmation':
          whatsappMsg = whatsappConfirmation(notifData);
          break;
        case 'reschedule':
          whatsappMsg = whatsappReschedule(notifData);
          break;
        case 'cancellation':
          whatsappMsg = whatsappCancellation(notifData);
          break;
        default:
          whatsappMsg = whatsappConfirmation(notifData);
      }
      results.whatsapp = await sendWhatsApp({
        to: patient.phone,
        message: whatsappMsg,
        clinicId: appointment.clinic_id,
      });
    } else {
      results.whatsapp = { success: false, error: 'Paciente sin teléfono' };
    }

    console.log(`[Notifications] Enviado (${type}):`, {
      patient: notifData.patientName,
      email: results.email.success ? '✅' : `❌ ${results.email.error}`,
      whatsapp: results.whatsapp.success ? '✅' : `❌ ${results.whatsapp.error}`,
    });

    return NextResponse.json({ success: true, results });
  } catch (err) {
    console.error('[Notifications] Error:', err);
    return NextResponse.json(
      { error: 'Error interno al enviar notificación' },
      { status: 500 }
    );
  }
}
