import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const patientId = formData.get("patientId") as string | null;
    const description = formData.get("description") as string | null;
    const appointmentId = formData.get("appointmentId") as string | null;

    if (!file || !patientId) {
      return NextResponse.json(
        { error: "Archivo y patientId son campos requeridos" },
        { status: 400 }
      );
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

    // 2. Obtener clinic_id del usuario
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const clinicId = profile.clinic_id;

    // 3. Procesar archivo
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const fileExtension = originalName.substring(originalName.lastIndexOf("."));
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const storagePath = `${clinicId}/${patientId}/direct/${uniqueFileName}`;

    // 4. Subir a storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from("clinical-attachments")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[NERVE Direct Upload] Storage error:", uploadError);
      return NextResponse.json({ error: "Error al subir el archivo" }, { status: 500 });
    }

    // 5. Insertar metadatos
    const insertData: Record<string, any> = {
      clinic_id: clinicId,
      patient_id: patientId,
      file_path: storagePath,
      file_name: originalName,
      description: description || null,
    };

    // Solo agregar appointment_id si es un UUID válido
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (appointmentId && uuidRegex.test(appointmentId)) {
      insertData.appointment_id = appointmentId;
    }

    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("medical_record_photos")
      .insert([insertData])
      .select()
      .single();

    if (dbError) {
      console.error("[NERVE Direct Upload] DB error:", dbError);
      await supabaseAdmin.storage.from("clinical-attachments").remove([storagePath]);
      return NextResponse.json({ error: "Error al registrar la foto" }, { status: 500 });
    }

    console.log("[NERVE Direct Upload] Success:", dbData?.id);

    return NextResponse.json({
      success: true,
      message: "Foto clínica subida exitosamente",
      photo: dbData,
    });
  } catch (error: any) {
    console.error("[NERVE Direct Upload] Unexpected error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
