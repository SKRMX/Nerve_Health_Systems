import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ error: "patientId es requerido" }, { status: 400 });
    }

    // 1. Autenticar sesión del usuario
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() { /* read-only */ },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Obtener el clinic_id del usuario logueado
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    // 3. Query fotos del paciente (solo si pertenece a su clínica)
    const { data: photos, error: photosError } = await supabaseAdmin
      .from("medical_record_photos")
      .select(`
        *,
        appointments (
          start_time
        )
      `)
      .eq("patient_id", patientId)
      .eq("clinic_id", profile.clinic_id)
      .order("created_at", { ascending: false });

    if (photosError) {
      console.error("[NERVE Photos List API] DB query error:", photosError);
      return NextResponse.json({ error: "Error al consultar fotos" }, { status: 500 });
    }

    // 4. Generar signed URLs para cada foto
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        const { data: signedData, error: signedError } = await supabaseAdmin.storage
          .from("clinical-attachments")
          .createSignedUrl(photo.file_path, 600); // 10 min

        return {
          ...photo,
          url: signedError ? null : signedData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      photos: photosWithUrls,
    });

  } catch (error: any) {
    console.error("[NERVE Photos List API] Unexpected error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
