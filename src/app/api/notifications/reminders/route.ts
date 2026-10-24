/**
 * GET /api/notifications/reminders
 * Called by a cron job every hour to send appointment reminders.
 * Sends reminders at 48h and 24h before the appointment.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/notifications/email';
import { sendWhatsApp } from '@/lib/notifications/whatsapp';
import {
  type AppointmentNotificationData,
  emailReminder,
  whatsappReminder24h,
  whatsappReminder48h,
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
  const mx = new Date(d.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  return format(mx, "d 'de' MMMM 'de' yyyy", { locale: es });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const mx = new Date(d.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
  return format(mx, 'hh:mm a', { locale: es });
}

export async function GET(request: NextRequest) {
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
    
    // Check for cron token (in case it's triggered externally by Vercel/Hostinger)
    const authHeader = request.headers.get("authorization");
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!session && !isCron) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const now = new Date();

    // Window: appointments between 23-25 hours from now (for 24h reminder)
    // and between 47-49 hours from now (for 48h reminder)
    const windows = [
      { label: '24h', hours: 24, field: 'reminder_24h_sent' },
      { label: '48h', hours: 48, field: 'reminder_48h_sent' },
    ];

    let totalSent = 0;

    for (const window of windows) {
      const windowStart = new Date(now.getTime() + (window.hours - 1) * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + (window.hours + 1) * 60 * 60 * 1000);

      // Find appointments in this window that haven't received a reminder
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients ( first_name, last_name, email, phone ),
          users:doctor_id ( first_name, last_name ),
          clinics:clinic_id ( name )
        `)
        .gte('start_time', windowStart.toISOString())
        .lte('start_time', windowEnd.toISOString())
        .in('status', ['Programado', 'En sala'])
        .or(`${window.field}.is.null,${window.field}.eq.false`);

      if (error) {
        console.error(`[Reminders] Error fetching ${window.label} appointments:`, error);
        continue;
      }

      if (!appointments || appointments.length === 0) {
        console.log(`[Reminders] No ${window.label} reminders to send`);
        continue;
      }

      const doctorSettings: Record<string, boolean> = {};

      for (const apt of appointments) {
        const patient = apt.patients;
        const doctor = apt.users;
        const clinic = apt.clinics;

        if (!patient) continue;

        const notifData: AppointmentNotificationData = {
          patientName: `${patient.first_name} ${patient.last_name}`,
          doctorName: doctor ? `${doctor.first_name} ${doctor.last_name}` : 'No asignado',
          clinicName: clinic?.name || 'NERVE Health',
          date: formatDate(apt.start_time),
          time: formatTime(apt.start_time),
          type: apt.type || 'Consulta',
          title: apt.title || 'Cita médica',
        };

        // Send email reminder
        if (patient.email) {
          const emailData = emailReminder(notifData, window.hours);
          await sendEmail({
            to: patient.email,
            subject: emailData.subject,
            html: emailData.html,
          });
        }

        // Send WhatsApp reminder
        if (patient.phone) {
          // Check if doctor has WA reminders enabled
          let waEnabled = doctorSettings[apt.doctor_id];
          if (waEnabled === undefined) {
            const { data: profile } = await supabase
              .from('doctor_profiles')
              .select('whatsapp_reminders_enabled')
              .eq('user_id', apt.doctor_id)
              .maybeSingle();
            waEnabled = profile ? profile.whatsapp_reminders_enabled !== false : true;
            doctorSettings[apt.doctor_id] = waEnabled;
          }

          if (waEnabled) {
            const whatsappMsg = window.hours >= 48
              ? whatsappReminder48h(notifData)
              : whatsappReminder24h(notifData);
            await sendWhatsApp({
              to: patient.phone,
              message: whatsappMsg,
              clinicId: apt.clinic_id,
            });
          } else {
            console.log(`[Reminders] Skipping WhatsApp for ${notifData.patientName} (Disabled by Doctor)`);
          }
        }

        // Mark reminder as sent
        await supabase
          .from('appointments')
          .update({ [window.field]: true })
          .eq('id', apt.id);

        totalSent++;
        console.log(`[Reminders] ${window.label} reminder sent to ${notifData.patientName}`);
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: totalSent,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error('[Reminders] Error:', err);
    return NextResponse.json({ error: 'Error processing reminders' }, { status: 500 });
  }
}
