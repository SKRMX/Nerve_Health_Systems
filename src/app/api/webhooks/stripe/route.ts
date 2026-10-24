import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/notifications";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import { sendEmail } from "@/lib/notifications/email";
import { whatsappConfirmation, emailConfirmation } from "@/lib/notifications/templates";
import { getCountryConfig, formatPrice } from "@/lib/international";
import { parseISO } from "date-fns";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "stripe_placeholder_build_key", {
  apiVersion: "2024-06-20" as any,
});

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
    const payload = await request.text();
    const sig = request.headers.get("stripe-signature") || "";
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[Stripe Webhook] Error: STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err: any) {
      console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log(`[Stripe Webhook] Received event of type: ${event.type}`);

    // --- CASE 0: Connected Account Updated (Stripe Custom Onboarding Verification) ---
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      const stripeAccountId = account.id;

      const chargesEnabled = account.charges_enabled;
      const payoutsEnabled = account.payouts_enabled;
      const detailsSubmitted = account.details_submitted;

      const onboardingCompleted = chargesEnabled && payoutsEnabled && detailsSubmitted;

      if (onboardingCompleted) {
        console.log(`[Stripe Webhook] Connect Account ${stripeAccountId} successfully completed onboarding.`);
        
        const { error: dbErr } = await supabaseAdmin
          .from("doctor_profiles")
          .update({ stripe_onboarding_completed: true })
          .eq("stripe_account_id", stripeAccountId);

        if (dbErr) {
          console.error(`[Stripe Webhook] Error updating doctor profile for account ${stripeAccountId}:`, dbErr);
        } else {
          await sendTelegramMessage(
            `✅ *Cuenta de Stripe Connect Verificada*\n\n` +
            `*Cuenta ID:* \`${stripeAccountId}\`\n` +
            `*Estatus:* Depósitos activados exitosamente.`
          );
        }
      } else {
        console.log(`[Stripe Webhook] Connect Account ${stripeAccountId} updated, but onboarding not yet completed. Charges enabled: ${chargesEnabled}, Payouts enabled: ${payoutsEnabled}`);
      }

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // --- CASE 1: Checkout Session Completed (Appointments Booking / Clinic Subscription) ---
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.CheckoutSession;

      if (session.payment_status === "paid") {
        console.log(`[Stripe Webhook] Processing successful payment for session: ${session.id} (Mode: ${session.mode})`);

        // --- CASE 1A: Subscription Payment (Clinic Monthly Plan) ---
        if (session.mode === "subscription") {
          let clinicId = session.metadata?.clinic_id;
          const tier = session.metadata?.subscription_tier || "solo";

          if (!clinicId) {
            // Fallback: search by stripe_checkout_session_id
            const { data: foundClinic } = await supabaseAdmin
              .from("clinics")
              .select("id")
              .eq("stripe_checkout_session_id", session.id)
              .maybeSingle();
            clinicId = foundClinic?.id;
          }

          if (clinicId) {
            const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            await supabaseAdmin
              .from("clinics")
              .update({
                subscription_status: "active",
                subscription_tier: tier,
                stripe_subscription_id: session.subscription as string,
                current_period_end: periodEnd
              })
              .eq("id", clinicId);

            console.log(`[Stripe Webhook] Clinic ${clinicId} activated. Subscription ID: ${session.subscription}`);
            
            await sendTelegramMessage(
              `💳 *Suscripción Mensual Activada (Stripe)*\n\n` +
              `*Clínica ID:* \`${clinicId}\`\n` +
              `*Plan:* ${tier.toUpperCase()}\n` +
              `*ID Suscripción:* \`${session.subscription}\``
            );
          } else {
            console.error(`[Stripe Webhook] Clinic not found for subscription session: ${session.id}`);
          }
          return NextResponse.json({ received: true }, { status: 200 });
        }

        // --- CASE 1B: Single Payment (Appointments Booking) ---
        // Fetch corresponding appointment from Supabase (using separate selects to bypass schema cache relationships)
        const { data: appointment, error: appError } = await supabaseAdmin
          .from("appointments")
          .select("*")
          .eq("stripe_checkout_session_id", session.id)
          .maybeSingle();

        if (appError || !appointment) {
          console.error(`[Stripe Webhook] Appointment not found for session ${session.id}:`, appError);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        // Avoid double processing
        if (appointment.payment_status === "pagado") {
          console.log(`[Stripe Webhook] Appointment ${appointment.id} is already marked as paid.`);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        // Fetch corresponding doctor profile separately
        const { data: doctorProfile, error: docError } = await supabaseAdmin
          .from("doctor_profiles")
          .select("*")
          .eq("user_id", appointment.doctor_id)
          .maybeSingle();

        if (docError || !doctorProfile) {
          console.error(`[Stripe Webhook] Doctor profile not found for user_id ${appointment.doctor_id}:`, docError);
          return NextResponse.json({ received: true }, { status: 200 });
        }
        const countryCode = doctorProfile.country_code || "MX";
        const config = getCountryConfig(countryCode);

        // Calculate platform fee and paid amount
        const amountPaid = session.amount_total ? (session.amount_total / 100) : appointment.payment_amount;
        const platformFee = config.fee;

        // Generate Jitsi url if teleconsulta and not generated
        let teleUrl = appointment.teleconsulta_url;
        if (appointment.appointment_type === "teleconsulta" && !teleUrl) {
          const roomHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          teleUrl = `https://meet.jit.si/NERVE-${roomHash}`;
        }

        // Update appointment in Database
        const { error: updateError } = await supabaseAdmin
          .from("appointments")
          .update({
            payment_status: "pagado",
            payment_amount: amountPaid,
            platform_fee: platformFee,
            teleconsulta_url: teleUrl,
            status: "scheduled" // Confirm the appointment
          })
          .eq("id", appointment.id);

        if (updateError) {
          console.error(`[Stripe Webhook] Error updating appointment ${appointment.id}:`, updateError);
          return NextResponse.json({ received: true }, { status: 200 });
        }

        console.log(`[Stripe Webhook] Appointment ${appointment.id} marked as PAID. Jitsi URL: ${teleUrl}`);

        // --- DISPATCH NOTIFICATIONS ---
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

        // WhatsApp Confirmation text
        const waText = whatsappConfirmation(notificationData);

        // Send WhatsApp
        sendWhatsApp({
          to: appointment.public_patient_phone,
          message: waText,
          clinicId: appointment.clinic_id
        }).then(res => {
          if (!res.success) console.error('[Stripe Webhook] WhatsApp delivery failed:', res.error);
        }).catch(err => console.error('[Stripe Webhook] WhatsApp exception:', err));

        // Send Email
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
            if (!res.success) console.error('[Stripe Webhook] Email delivery failed:', res.error);
          }).catch(err => console.error('[Stripe Webhook] Email exception:', err));
        }

        // Notify Admin on Telegram
        const priceFormatted = formatPrice(amountPaid, countryCode);
        const feeFormatted = formatPrice(platformFee, countryCode);
        
        await sendTelegramMessage(
          `📅 *Nueva Cita Pagada (Stripe Connect)*\n\n` +
          `*Médico:* ${doctorProfile.full_name || 'Médico'}\n` +
          `*Paciente:* ${appointment.public_patient_name}\n` +
          `*Monto:* ${priceFormatted}\n` +
          `*Modalidad:* ${appointment.appointment_type.toUpperCase()}\n` +
          `*Comisión Plataforma:* ${feeFormatted}`
        );
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[Stripe Webhook] Unhandled exception:", error);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
