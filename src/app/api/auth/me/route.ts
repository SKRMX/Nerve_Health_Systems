import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = await cookies();

    // 1. Create a server client to verify the user's session
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Read-only in route handlers
          },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Use service role key to bypass RLS and fetch profile + clinic
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', profile.clinic_id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      clinic: clinic || null,
    });
  } catch (err) {
    console.error('API /auth/me error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
