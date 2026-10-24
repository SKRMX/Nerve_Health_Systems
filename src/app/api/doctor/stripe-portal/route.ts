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

    const supabaseAdmin = getSupabaseAdmin();

    // Get current doctor profile with robust matching & clinic fallback
    let { data: profile } = await supabaseAdmin
      .from('doctor_profiles')
      .select('stripe_account_id, stripe_onboarding_completed')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    if (!profile?.stripe_account_id) {
      const { data: userProfile } = await supabaseAdmin
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .maybeSingle();

      if (userProfile?.clinic_id) {
        const { data: clinicDoc } = await supabaseAdmin
          .from('doctor_profiles')
          .select('stripe_account_id, stripe_onboarding_completed')
          .eq('clinic_id', userProfile.clinic_id)
          .not('stripe_account_id', 'is', null)
          .maybeSingle();
        if (clinicDoc) {
          profile = clinicDoc;
        }
      }
    }

    if (!profile || !profile.stripe_account_id) {
      return NextResponse.json({ error: 'Cuenta de Stripe no configurada o perfil médico no encontrado' }, { status: 404 });
    }


    // Generate Express Account Login Link
    try {
      const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id);
      return NextResponse.json({ success: true, url: loginLink.url });
    } catch (stripeErr: any) {
      console.error('[Stripe Login Link Error]:', stripeErr);
      return NextResponse.json({
        error: `Error al generar el portal de Stripe: ${stripeErr.message}`
      }, { status: 400 });
    }

  } catch (err: any) {
    console.error('[Stripe Portal API] Exception:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
