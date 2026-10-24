import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { decryptToken } from "@/lib/cryptoToken";
import { v4 as uuidv4 } from "uuid";

// Usamos el cliente de Supabase Admin (con service role) para poder saltar las RLS
// y subir/escribir de forma segura en nombre del doctor que escaneó el QR.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper: convierte valores no-UUID (ej. "none", "", undefined) en null
function toUuidOrNull(value: string | undefined | null): string | null {
  if (!value || value === "none" || value === "null" || value === "undefined") return null;
  // Validar formato UUID v4 básico
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value) ? value : null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const token = formData.get("token") as string | null;
    const description = formData.get("description") as string | null;

    if (!file || !token) {
      return NextResponse.json(
        { error: "Archivo (file) y token (token) son campos requeridos" },
        { status: 400 }
      );
    }

    // 1. Descifrar y validar el token
    let payload;
    try {
      payload = decryptToken(token);
    } catch (tokenErr) {
      console.error("[NERVE Upload API] Token decryption failed:", tokenErr);
      return NextResponse.json({ error: "Token de carga inválido o corrupto" }, { status: 400 });
    }

    const { clinicId, patientId, recordId, appointmentId, expiresAt } = payload;

    // 2. Validar que el token no haya expirado
    if (Date.now() > expiresAt) {
      return NextResponse.json({ error: "El token de carga ha expirado (límite de 5 minutos)" }, { status: 410 });
    }

    // 3. Sanitizar IDs opcionales (evitar error UUID "none")
    const safeRecordId = toUuidOrNull(recordId);
    const safeAppointmentId = toUuidOrNull(appointmentId);

    console.log("[NERVE Upload API] Processing upload:", {
      clinicId,
      patientId,
      recordId: safeRecordId,
      appointmentId: safeAppointmentId,
      fileName: file.name,
      fileSize: file.size,
    });

    // 4. Procesar y sanitizar el archivo
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name;
    const fileExtension = originalName.substring(originalName.lastIndexOf("."));
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    // Usar "direct" como subcarpeta cuando no hay recordId válido
    const recordFolder = safeRecordId || "direct";
    const storagePath = `${clinicId}/${patientId}/${recordFolder}/${uniqueFileName}`;

    // 5. Subir archivo a Supabase Storage (en el bucket privado)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("clinical-attachments")
      .upload(storagePath, fileBuffer, {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      console.error("[NERVE Upload API] Supabase Storage upload error:", uploadError);
      return NextResponse.json({ error: "Fallo al subir el archivo al almacenamiento privado" }, { status: 500 });
    }

    // 6. Construir el objeto de inserción — solo incluir campos con valores válidos
    const insertData: Record<string, any> = {
      clinic_id: clinicId,
      patient_id: patientId,
      file_path: storagePath,
      file_name: originalName,
      description: description || null,
    };
    // Solo agregar campos UUID opcionales si tienen valores válidos
    if (safeRecordId) insertData.medical_record_id = safeRecordId;
    if (safeAppointmentId) insertData.appointment_id = safeAppointmentId;

    // 7. Registrar metadatos en la tabla public.medical_record_photos
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("medical_record_photos")
      .insert([insertData])
      .select()
      .single();

    if (dbError) {
      console.error("[NERVE Upload API] DB insert error:", dbError);
      // Limpiar el archivo subido en storage si la base de datos falla
      await supabaseAdmin.storage.from("clinical-attachments").remove([storagePath]);
      return NextResponse.json({ error: "Fallo al registrar la foto en la base de datos" }, { status: 500 });
    }

    console.log("[NERVE Upload API] Photo uploaded successfully:", dbData?.id);

    return NextResponse.json({
      success: true,
      message: "Foto clínica subida y registrada exitosamente",
      photo: dbData,
    });

  } catch (error: any) {
    console.error("[NERVE Upload API] Unexpected error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
