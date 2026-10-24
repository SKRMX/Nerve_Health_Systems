import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

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

    // 1. Verify User Auth
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

    const body = await request.json();
    const {
      bank_name,
      bank_account_clabe,
      bank_beneficiary_name,
      bank_rfc,
      country_code,
      currency,
      payment_mode,
      anticipo_amount
    } = body;

    // Validate minimum required fields
    if (!country_code || !currency || !payment_mode) {
      return NextResponse.json({ error: 'Faltan parámetros obligatorios (país, divisa o modo de pago)' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get current doctor profile with robust matching & clinic fallback
    let { data: profile } = await supabaseAdmin
      .from('doctor_profiles')
      .select('*')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!profile) {
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .maybeSingle();

      if (userProfile?.clinic_id) {
        const { data: clinicDoc } = await supabaseAdmin
          .from('doctor_profiles')
          .select('*')
          .eq('clinic_id', userProfile.clinic_id)
          .maybeSingle();
        if (clinicDoc) profile = clinicDoc;
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Perfil médico no encontrado' }, { status: 404 });
    }

    let stripeAccountId = profile.stripe_account_id;
    let onboardingCompleted = profile.stripe_onboarding_completed;

    // If payment_mode is not 'ninguno' and bank details are provided, configure Stripe Express Account
    if (payment_mode !== 'ninguno' && bank_account_clabe && bank_beneficiary_name) {
      if (!stripeAccountId) {
        try {
          // Create express stripe account for the doctor with daily payouts
          const account = await stripe.accounts.create({
            type: 'express',
            country: country_code,
            email: user.email,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            settings: {
              payouts: {
                schedule: {
                  interval: 'daily',
                }
              }
            },
            business_profile: {
              mcc: '8099', // Medical Services
              url: `https://nervehealthsystems.com/dr/${profile.slug || ''}`,
            }
          });
          stripeAccountId = account.id;
          onboardingCompleted = false;

        } catch (stripeCreateErr: any) {
          console.error('[Stripe Express Creation Error]:', stripeCreateErr);
          return NextResponse.json({
            error: `Error al crear tu cuenta de cobro en Stripe Connect: ${stripeCreateErr.message}`
          }, { status: 400 });
        }
      } else {
        // Ensure existing Stripe account has daily payout schedule
        try {
          await stripe.accounts.update(stripeAccountId, {
            settings: {
              payouts: {
                schedule: {
                  interval: 'daily',
                }
              }
            }
          });
        } catch (e: any) {
          console.log('[Stripe Schedule Update Warning]:', e?.message);
        }
      }
    }
    // Save all to database (Supabase)
    const { error: updateErr } = await supabaseAdmin
      .from('doctor_profiles')
      .update({
        bank_name: bank_name || null,
        bank_account_clabe: bank_account_clabe || null,
        bank_beneficiary_name: bank_beneficiary_name || null,
        bank_rfc: bank_rfc || null,
        country_code,
        currency,
        payment_mode,
        anticipo_amount: parseFloat(anticipo_amount || 0),
        stripe_account_id: stripeAccountId || null,
        stripe_onboarding_completed: onboardingCompleted
      })
      .eq('user_id', user.id);

    if (updateErr) {
      console.error('[Bank Setup API] DB Update error:', updateErr);
      return NextResponse.json({ error: 'Error al actualizar el perfil en la base de datos' }, { status: 500 });
    }

    // Propagate country and currency to the doctor's clinic as well
    if (profile.clinic_id) {
      await supabaseAdmin
        .from('clinics')
        .update({
          country_code,
          currency
        })
        .eq('id', profile.clinic_id);
    }

    // Generate Stripe Onboarding link if stripeAccountId is created
    let onboardingUrl = '';
    if (stripeAccountId) {
      try {
        const originUrl = request.headers.get("origin") || "https://nervehealthsystems.com";
        const accountLink = await stripe.accountLinks.create({
          account: stripeAccountId,
          refresh_url: `${originUrl}/dashboard/configuracion?stripe_refresh=true`,
          return_url: `${originUrl}/dashboard/configuracion?stripe_success=true`,
          type: 'account_onboarding',
        });
        onboardingUrl = accountLink.url;
      } catch (linkErr: any) {
        console.error('[Bank Setup API] Error generating account link:', linkErr);
      }
    }

    return NextResponse.json({
      success: true,
      stripe_account_id: stripeAccountId,
      stripe_onboarding_completed: onboardingCompleted,
      stripe_onboarding_url: onboardingUrl
    });

  } catch (err: any) {
    console.error('[Bank Setup API] Exception:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
