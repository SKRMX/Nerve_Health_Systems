import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { addMinutes, parseISO } from 'date-fns';
import { sendWhatsApp } from '@/lib/notifications/whatsapp';
import { sendEmail } from '@/lib/notifications/email';
import { whatsappConfirmation, emailConfirmation } from '@/lib/notifications/templates';

import Stripe from 'stripe';
import { getCountryConfig } from '@/lib/international';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'stripe_placeholder_build_key', {
  apiVersion: '2024-06-20' as any,
});

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Spanish date and time formatting helper functions
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
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { doctor_id, start_time, name, phone, email, notes, appointment_type } = body;

    // Validate required fields
    if (!doctor_id || !start_time || !name || !phone) {
      return NextResponse.json({ error: 'Faltan campos obligatorios (doctor_id, start_time, name, phone)' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // 1. Fetch the doctor's profile and clinic info
    const { data: doctorProfile, error: profileError } = await supabaseAdmin
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', doctor_id)
      .maybeSingle();

    if (profileError || !doctorProfile) {
      console.error('[Public Booking API] Doctor profile not found:', doctor_id, profileError);
      return NextResponse.json({ error: 'Médico no encontrado' }, { status: 404 });
    }

    const clinicId = doctorProfile.clinic_id;
    if (!clinicId) {
      return NextResponse.json({ error: 'La clínica del médico no está configurada' }, { status: 500 });
    }

    // 2. Parse time and calculate end_time
    const parsedStart = parseISO(start_time);
    const duration = Number(doctorProfile.schedule_settings?.duration) || 30;
    const parsedEnd = addMinutes(parsedStart, duration);

    // 3. Smart Patient Matching
    const inputPhoneCleaned = phone.replace(/\D/g, '');
    const last10Digits = inputPhoneCleaned.slice(-10);

    let matchedPatientId: string | null = null;
    let matchStatus: 'linked' | 'pending' | 'new_patient' = 'new_patient';

    if (last10Digits.length === 10) {
      const { data: candidates, error: candidateError } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('clinic_id', clinicId)
        .like('phone', `%${last10Digits}%`);

      if (candidateError) {
        console.error('[Public Booking API] Error finding candidates:', candidateError);
      }

      if (candidates && candidates.length > 0) {
        const totalMatch = candidates.find(c => {
          if (!email || !c.email) return false;
          return c.email.trim().toLowerCase() === email.trim().toLowerCase();
        });

        if (totalMatch) {
          matchedPatientId = totalMatch.id;
          matchStatus = 'linked';
        } else {
          matchedPatientId = null;
          matchStatus = 'pending';
        }
      }
    }

    // 4. Create new patient profile if no match
    if (matchStatus === 'new_patient') {
      const parts = name.trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      const { data: newPatient, error: newPatientError } = await supabaseAdmin
        .from('patients')
        .insert({
          clinic_id: clinicId,
          first_name: firstName,
          last_name: lastName || 'Pérez',
          phone: phone,
          email: email || null
        })
        .select()
        .single();

      if (newPatientError) {
        console.error('[Public Booking API] Error creating new patient:', newPatientError);
        return NextResponse.json({ error: 'Error al registrar la información del paciente' }, { status: 500 });
      }

      matchedPatientId = newPatient.id;
    }

    // Determine payment requirements and pricing
    const paymentMode = doctorProfile.payment_mode || 'ninguno';
    const isPaymentRequired = paymentMode !== 'ninguno' && !!doctorProfile.stripe_account_id && !!doctorProfile.stripe_onboarding_completed;

    let chargeAmount = 0;
    if (paymentMode === 'completo') {
      chargeAmount = appointment_type === 'teleconsulta'
        ? Number(doctorProfile.teleconsulta_price || 0)
        : Number(doctorProfile.presencial_price || 0);
    } else if (paymentMode === 'anticipo') {
      chargeAmount = Number(doctorProfile.anticipo_amount || 0);
    }

    const paymentStatus = isPaymentRequired ? 'pendiente' : 'no_requerido';

    // Generate Jitsi room if teleconsulta
    let teleUrl = null;
    if (appointment_type === 'teleconsulta') {
      const roomHash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      teleUrl = `https://meet.jit.si/NERVE-${roomHash}`;
    }

    // 5. Insert the appointment
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .insert({
        clinic_id: clinicId,
        doctor_id: doctor_id,
        patient_id: matchedPatientId,
        start_time: parsedStart.toISOString(),
        end_time: parsedEnd.toISOString(),
        status: 'scheduled',
        type: appointment_type === 'teleconsulta' ? 'Teleconsulta' : 'Consulta Presencial',
        title: notes || (appointment_type === 'teleconsulta' ? 'Videollamada médica' : 'Consulta en consultorio'),
        color_hex: '#14b8a6',
        public_patient_name: name,
        public_patient_phone: phone,
        public_patient_email: email || null,
        match_status: matchStatus,
        appointment_type: appointment_type || 'presencial',
        payment_status: paymentStatus,
        payment_amount: chargeAmount,
        teleconsulta_url: teleUrl
      })
      .select()
      .single();

    if (appointmentError) {
      console.error('[Public Booking API] Error inserting appointment:', appointmentError);
      return NextResponse.json({ error: 'Error al reservar la cita' }, { status: 500 });
    }

    // --- CASE A: Payment Required (Initiate Stripe Connect Custom Checkout Session) ---
    if (isPaymentRequired) {
      try {
        const originUrl = request.headers.get("origin") || "";
        const redirectBase = `${originUrl}/dr/${doctorProfile.slug}`;

        // Get currency and fee configuration
        const countryCode = doctorProfile.country_code || 'MX';
        const config = getCountryConfig(countryCode);
        const currency = config.currency.toLowerCase();
        
        // Fee to charge: equivalent to $20 MXN
        const commissionAmount = config.fee;
        
        // Create Checkout Session using destination charges in embedded mode
        const session = await stripe.checkout.sessions.create({
          ui_mode: 'embedded',
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: currency,
              product_data: {
                name: `Reserva Consulta - Dr(a). ${doctorProfile.full_name}`,
                description: paymentMode === 'anticipo' 
                  ? `Anticipo/Garantía de consulta - NERVE platform`
                  : `Pago total de consulta - NERVE platform`,
              },
              unit_amount: Math.round(chargeAmount * 100), // in cents
            },
            quantity: 1,
          }],
          mode: 'payment',
          payment_intent_data: {
            application_fee_amount: Math.round(commissionAmount * 100), // commission in cents
            transfer_data: {
              destination: doctorProfile.stripe_account_id,
            },
            on_behalf_of: doctorProfile.stripe_account_id,
            metadata: {
              appointment_id: appointment.id,
              doctor_id: doctor_id,
              clinic_id: clinicId
            }
          },

          return_url: `${redirectBase}?booking_success=true&appointment_id=${appointment.id}&session_id={CHECKOUT_SESSION_ID}`,
        });

        // Save stripe checkout session details in the appointment
        await supabaseAdmin
          .from("appointments")
          .update({ stripe_checkout_session_id: session.id })
          .eq("id", appointment.id);

        return NextResponse.json({
          success: true,
          payment_required: true,
          client_secret: session.client_secret,
          session_id: session.id,
          appointment: appointment,
        });
      } catch (err: any) {
        console.error('[Public Booking API] Stripe Session generation exception:', err);
        // Undo insertion to release slot
        await supabaseAdmin.from('appointments').delete().eq('id', appointment.id);
        return NextResponse.json({ error: 'Error al iniciar la pasarela de pagos. Por favor intenta de nuevo.' }, { status: 500 });
      }
    }

    // --- CASE B: Free Appointment (No Payment Required) ---
    // Send automatic confirmations (WhatsApp and Email) immediately
    const formattedDate = formatSpanishDate(parsedStart);
    const formattedTime = formatSpanishTime(parsedStart);
    const clinicName = doctorProfile.clinic_name || 'NERVE Clinic';

    const notificationData = {
      patientName: name,
      doctorName: doctorProfile.full_name,
      clinicName: clinicName,
      date: formattedDate,
      time: formattedTime,
      type: appointment_type === "teleconsulta" ? "Teleconsulta (Videollamada)" : "Consulta General",
      title: notes || 'Consulta médica',
      teleconsultaUrl: teleUrl || undefined
    };

    // Dispatch WhatsApp (Jitsi link included natively in template for teleconsultas)
    const waText = whatsappConfirmation(notificationData);

    sendWhatsApp({
      to: phone,
      message: waText,
      clinicId: clinicId
    }).then(res => {
      if (!res.success) console.error('[Public Booking API] WhatsApp delivery failed:', res.error);
    }).catch(err => console.error('[Public Booking API] WhatsApp exception:', err));

    // Dispatch Email
    if (email && email.trim()) {
      const emailContent = emailConfirmation(notificationData);
      let emailHtml = emailContent.html;
      if (appointment_type === 'teleconsulta' && teleUrl) {
        emailHtml += `<br/><br/><strong>💻 Enlace de la Videollamada:</strong> <a href="${teleUrl}">${teleUrl}</a>`;
      }

      sendEmail({
        to: email.trim(),
        subject: emailContent.subject + (appointment_type === 'teleconsulta' ? " (Online)" : ""),
        html: emailHtml
      }).then(res => {
        if (!res.success) console.error('[Public Booking API] Email delivery failed:', res.error);
      }).catch(err => console.error('[Public Booking API] Email exception:', err));
    }

    return NextResponse.json({
      success: true,
      payment_required: false,
      appointment,
      match_status: matchStatus
    });

  } catch (error) {
    console.error('[Public Booking API] Exception:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta el id de la cita' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();
    const { data: appointment, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        type,
        appointment_type,
        teleconsulta_url,
        payment_status,
        payment_amount,
        public_patient_name,
        public_patient_phone,
        public_patient_email
      `)
      .eq('id', id)
      .single();

    if (error || !appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error('[Public Booking API GET] Exception:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
