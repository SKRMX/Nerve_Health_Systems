import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

function getAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    // Process file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const fileExtension = originalName.substring(originalName.lastIndexOf('.'));
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const storagePath = `${user.id}/${uniqueFileName}`;

    const supabaseAdmin = getAdminClient();

    // Upload to public storage bucket 'profile-photos'
    const { error: uploadError } = await supabaseAdmin.storage
      .from('profile-photos')
      .upload(storagePath, fileBuffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('[Profile Upload API] Storage error:', uploadError);
      return NextResponse.json({ error: 'Error al subir la imagen a almacenamiento' }, { status: 500 });
    }

    // Generate public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-photos/${storagePath}`;

    return NextResponse.json({
      success: true,
      publicUrl
    });

  } catch (error) {
    console.error('[Profile Upload API] Exception:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
