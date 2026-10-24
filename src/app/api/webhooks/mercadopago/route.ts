import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/notifications";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import { sendEmail } from "@/lib/notifications/email";
import { whatsappConfirmation, emailConfirmation } from "@/lib/notifications/templates";
import { parseISO } from "date-fns";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper formatting functions for Spanish notifications
const SPANISH_MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function convertToMexicoTime(date: Date): Date {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
}

function formatSpanishDate(date: Date): string {
  const mxDate = convertToMexicoTime(date);
  const day = mxDate.getDate();
  const month = SPANISH_MONTHS[mxDate.getMonth()];
  const year = mxDate.getFullYear();
  return `${day} de ${month} de ${year}`;
}

function formatSpanishTime(date: Date): string {
  const mxDate = convertToMexicoTime(date);
  let hours = mxDate.getHours();
  const minutes = mxDate.getMinutes();
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, action, data, user_id } = body;

    console.log(`[MP Webhook] Received event. Type: ${type}, Action: ${action}, User ID: ${user_id}`);

    // --- CASE 1: Platform Subscriptions ---
    if (type === "subscription_preapproval") {
      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${data.id}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      );

      if (!mpResponse.ok) {
        console.error("Failed to fetch preapproval from MP");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const preapproval = await mpResponse.json();
      const clinicId = preapproval.external_reference;
      const status = preapproval.status;

      let subscriptionStatus = "trialing";
      if (status === "authorized") subscriptionStatus = "active";
      else if (status === "paused") subscriptionStatus = "past_due";
      else if (status === "cancelled") subscriptionStatus = "canceled";

      const periodEnd =
        subscriptionStatus === "active"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : undefined;

      const updateData: Record<string, any> = {
        subscription_status: subscriptionStatus,
        mp_subscription_id: preapproval.id,
      };
      if (periodEnd) updateData.current_period_end = periodEnd;

      if (clinicId) {
        await supabaseAdmin
          .from("clinics")
          .update(updateData)
          .eq("id", clinicId);

        console.log(`[NERVE Webhook] Clinic ${clinicId} → ${subscriptionStatus}`);

        const emoji = subscriptionStatus === "active" ? "✅" : "⚠️";
        await sendTelegramMessage(
          `💳 *Actualización de Pago*\n\n` +
          `*ID Clínica:* \`${clinicId}\`\n` +
          `*Nuevo Estado:* ${subscriptionStatus.toUpperCase()} ${emoji}\n` +
          `*ID Suscripción:* \`${preapproval.id}\``
        );
      }
    }

    // --- CASE 2: Patient Booking Payments ---
    if (type === "payment" || action === "payment.created" || action === "payment.updated") {
      const paymentId = data?.id || body.id;
      if (!paymentId) {
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Buscar el token del doctor usando user_id si se recibió en la notificación
      let activeAccessToken = MP_ACCESS_TOKEN;
      if (user_id) {
        const { data: docProf } = await supabaseAdmin
          .from("doctor_profiles")
          .select("mp_access_token")
          .eq("mp_client_id", String(user_id))
          .maybeSingle();

        if (docProf?.mp_access_token) {
          activeAccessToken = docProf.mp_access_token;
          console.log(`[MP Webhook] Using doctor OAuth access token for connection.`);
        }
      }

      // Obtener detalles del pago
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${activeAccessToken}` }
      });

      if (!mpResponse.ok) {
        console.error(`[MP Webhook] Failed to fetch payment ${paymentId} details from MP:`, await mpResponse.text());
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const payment = await mpResponse.json();
      const preferenceId = payment.preference_id;
      const extRef = payment.external_reference; // Contiene el ID del appointment
      const status = payment.status; // approved, pending, in_process, rejected, etc.
      const amount = payment.transaction_amount;

      console.log(`[MP Webhook] Payment ${paymentId} status is ${status}. Pref ID: ${preferenceId}. Ext Ref: ${extRef}`);

      if (status === "approved") {
        // Encontrar cita pendiente
        let appointmentQuery = supabaseAdmin.from("appointments").select("*, doctor_profiles(*)");
        if (extRef && extRef.startsWith("NERVE-")) {
          const cleanId = extRef.replace("NERVE-", "");
          appointmentQuery = appointmentQuery.eq("id", cleanId);
        } else if (preferenceId) {
          appointmentQuery = appointmentQuery.eq("mp_preference_id", preferenceId);
        } else {
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const { data: appointment, error: appError } = await appointmentQuery.maybeSingle();

        if (appError || !appointment) {
          console.error("[MP Webhook] Appointment not found for payment:", appError);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        // Si ya está marcada como pagada, no repetir flujo
        if (appointment.payment_status === "pagado") {
          console.log(`[MP Webhook] Appointment ${appointment.id} is already marked as paid.`);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        // Generar sala de Jitsi si es teleconsulta
        let teleUrl = appointment.teleconsulta_url;
        if (appointment.appointment_type === "teleconsulta" && !teleUrl) {
          const roomHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          teleUrl = `https://meet.jit.si/NERVE-${roomHash}`;
        }

        // Actualizar cita en Supabase
        const { error: updateError } = await supabaseAdmin
          .from("appointments")
          .update({
            payment_status: "pagado",
            mp_payment_id: String(paymentId),
            payment_amount: amount,
            platform_fee: 20.00, // Comisión de la plataforma
            teleconsulta_url: teleUrl,
            status: "scheduled" // Confirmar la cita
          })
          .eq("id", appointment.id);

        if (updateError) {
          console.error("[MP Webhook] Error updating appointment:", updateError);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        console.log(`[MP Webhook] Appointment ${appointment.id} marked as PAID. Jitsi URL: ${teleUrl}`);

        // --- ENVIAR NOTIFICACIONES WHATSAPP Y EMAIL ---
        const doctorProfile = appointment.doctor_profiles || {};
        const parsedStart = parseISO(appointment.start_time);
        const formattedDate = formatSpanishDate(parsedStart);
        const formattedTime = formatSpanishTime(parsedStart);
        const clinicName = doctorProfile.clinic_name || 'NERVE Clinic';

        const notificationData = {
          patientName: appointment.public_patient_name,
          doctorName: doctorProfile.full_name || 'Médico NERVE',
          clinicName: clinicName,
          date: formattedDate,
          time: formattedTime,
          type: appointment.appointment_type === "teleconsulta" ? "Teleconsulta (Videollamada)" : "Consulta General",
          title: appointment.title || 'Consulta médica',
          teleconsultaUrl: teleUrl || undefined
        };

        // Construir mensaje (link incluido nativamente en template)
        const waText = whatsappConfirmation(notificationData);

        // Despachar WhatsApp
        sendWhatsApp({
          to: appointment.public_patient_phone,
          message: waText,
          clinicId: appointment.clinic_id
        }).then(res => {
          if (!res.success) console.error('[MP Webhook] WhatsApp delivery failed:', res.error);
        }).catch(err => console.error('[MP Webhook] WhatsApp exception:', err));

        // Despachar Email si existe
        if (appointment.public_patient_email) {
          const emailContent = emailConfirmation(notificationData);
          let emailHtml = emailContent.html;
          if (appointment.appointment_type === "teleconsulta" && teleUrl) {
            emailHtml += `<br/><br/><strong>💻 Enlace de la Videollamada:</strong> <a href="${teleUrl}">${teleUrl}</a>`;
          }

          sendEmail({
            to: appointment.public_patient_email.trim(),
            subject: emailContent.subject + (appointment.appointment_type === "teleconsulta" ? " (Online)" : ""),
            html: emailHtml
          }).then(res => {
            if (!res.success) console.error('[MP Webhook] Email delivery failed:', res.error);
          }).catch(err => console.error('[MP Webhook] Email exception:', err));
        }

        // Notificación al administrador
        await sendTelegramMessage(
          `📅 *Nueva Cita Pagada (Cobro Dividido)*\n\n` +
          `*Médico:* ${doctorProfile.full_name || 'Médico'}\n` +
          `*Paciente:* ${appointment.public_patient_name}\n` +
          `*Monto:* $${amount} MXN\n` +
          `*Modalidad:* ${appointment.appointment_type.toUpperCase()}\n` +
          `*Comisión Plataforma:* $20.00 MXN`
        );
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[MP Webhook] Unhandled Error:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
