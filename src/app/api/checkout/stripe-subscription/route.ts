import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCountryConfig } from '@/lib/international';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'stripe_placeholder_build_key', {
  apiVersion: '2024-06-20' as any,
});

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();

    // 1. Authenticate user
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Read-only
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 2. Fetch doctor profile to find clinic
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileErr || !profile || !profile.clinic_id) {
      return NextResponse.json({ error: 'Clínica no asociada o perfil médico no encontrado' }, { status: 404 });
    }

    const { data: clinic, error: clinicErr } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', profile.clinic_id)
      .single();

    if (clinicErr || !clinic) {
      return NextResponse.json({ error: 'Clínica no encontrada' }, { status: 404 });
    }

    const originUrl = request.headers.get("origin") || "";
    const redirectBase = `${originUrl}/dashboard/suscripcion`;

    const countryCode = clinic.country_code || 'MX';
    const config = getCountryConfig(countryCode);
    const currency = config.currency.toLowerCase();

    // Calculate subscription pricing
    const isClinicPlan = clinic.subscription_tier === 'pro';
    const priceAmount = isClinicPlan ? config.monthlyClinic : config.monthlySolo;
    const planName = isClinicPlan ? 'Clínica Pro' : 'Doctor Solo';

    // 3. Create Stripe Checkout Session for subscription (recurring payment)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency,
          product_data: {
            name: `Plan NERVE ${planName}`,
            description: `Mensualidad recurrente para tu consultorio médico en NERVE`,
          },
          unit_amount: Math.round(priceAmount * 100), // in cents
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${redirectBase}?checkout_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${redirectBase}?checkout_canceled=true`,
      metadata: {
        clinic_id: clinic.id,
        subscription_tier: clinic.subscription_tier
      }
    });

    // Save subscription session details in clinic
    await supabaseAdmin
      .from('clinics')
      .update({
        stripe_checkout_session_id: session.id
      })
      .eq('id', clinic.id);

    return NextResponse.json({
      success: true,
      checkout_url: session.url
    });

  } catch (err: any) {
    console.error('[Stripe Subscription API] Error creating checkout session:', err);
    return NextResponse.json({ error: err.message || 'Error interno al procesar pasarela' }, { status: 500 });
  }
}
