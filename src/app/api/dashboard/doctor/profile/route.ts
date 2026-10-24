import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Create a service role client to bypass RLS for administrative tasks
function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET: Fetch the current doctor's profile
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();
    
    // Fetch doctor profile linked to user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('doctor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[Profile API GET] Error:', profileError);
      return NextResponse.json({ error: 'Error al obtener el perfil' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('[Profile API GET] Exception:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Create or update the doctor's profile
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      slug,
      bio,
      specialty,
      profile_photo_url,
      gallery_images,
      clinic_city,
      clinic_state,
      clinic_postal_code,
      social_links,
      schedule_settings,
      full_name,
      clinic_name,
      clinic_phone,
      clinic_email
    } = body;

    // Validate Slug format if provided
    let cleanedSlug = '';
    if (slug) {
      cleanedSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      if (cleanedSlug.startsWith('-')) cleanedSlug = cleanedSlug.slice(1);
      if (cleanedSlug.endsWith('-')) cleanedSlug = cleanedSlug.slice(0, -1);
      
      if (cleanedSlug.length < 3) {
        return NextResponse.json({ error: 'El enlace de perfil (slug) debe tener al menos 3 caracteres' }, { status: 400 });
      }
    }

    const supabaseAdmin = getAdminClient();

    // Check if the slug is already taken by another doctor
    if (cleanedSlug) {
      const { data: existingSlug, error: slugCheckError } = await supabaseAdmin
        .from('doctor_profiles')
        .select('id')
        .eq('slug', cleanedSlug)
        .neq('user_id', user.id)
        .maybeSingle();

      if (slugCheckError) {
        console.error('[Profile API POST] Slug check error:', slugCheckError);
        return NextResponse.json({ error: 'Error al validar el enlace de perfil' }, { status: 500 });
      }

      if (existingSlug) {
        return NextResponse.json({ error: 'Este enlace de perfil ya está en uso por otro médico' }, { status: 400 });
      }
    }

    // Get the user's clinic_id to ensure proper linkage
    const { data: userData, error: userFetchError } = await supabaseAdmin
      .from('users')
      .select('clinic_id')
      .eq('id', user.id)
      .single();

    if (userFetchError || !userData) {
      console.error('[Profile API POST] User fetch error:', userFetchError);
      return NextResponse.json({ error: 'Usuario no encontrado en la base de datos' }, { status: 500 });
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const profileData = {
      slug: cleanedSlug || null,
      bio: bio || '',
      specialty: specialty || '',
      profile_photo_url: profile_photo_url || null,
      gallery_images: gallery_images || [],
      clinic_city: clinic_city || '',
      clinic_state: clinic_state || '',
      clinic_postal_code: clinic_postal_code || '',
      social_links: social_links || {},
      schedule_settings: schedule_settings || {},
      full_name: full_name || '',
      clinic_name: clinic_name || '',
      clinic_phone: clinic_phone || '',
      clinic_email: clinic_email || '',
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingProfile) {
      // Update
      result = await supabaseAdmin
        .from('doctor_profiles')
        .update(profileData)
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // Insert new profile
      result = await supabaseAdmin
        .from('doctor_profiles')
        .insert({
          ...profileData,
          user_id: user.id,
          clinic_id: userData.clinic_id
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('[Profile API POST] Save error:', result.error);
      return NextResponse.json({ error: 'Error al guardar el perfil' }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: result.data });
  } catch (error) {
    console.error('[Profile API POST] Exception:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
