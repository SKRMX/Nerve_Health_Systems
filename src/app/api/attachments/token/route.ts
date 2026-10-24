import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { encryptToken } from "@/lib/cryptoToken";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const recordId = searchParams.get("recordId");
    const appointmentId = searchParams.get("appointmentId") || "none";

    if (!patientId || !recordId) {
      return NextResponse.json(
        { error: "Parámetros faltantes: patientId y recordId son requeridos" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // 1. Autenticar sesión del usuario
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // Solo lectura en endpoints
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Obtener el perfil del usuario (para obtener clinic_id)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const clinicId = profile.clinic_id;
    if (!clinicId) {
      return NextResponse.json({ error: "El usuario no pertenece a ninguna clínica" }, { status: 400 });
    }

    // 3. Crear el token con una expiración corta (5 minutos = 300,000 ms)
    const expiresAt = Date.now() + 5 * 60 * 1000;
    const tokenPayload = {
      clinicId,
      patientId,
      recordId,
      appointmentId,
      expiresAt,
    };

    const token = encryptToken(tokenPayload);

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
    });

  } catch (error: any) {
    console.error("[NERVE Token API] Unexpected error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
