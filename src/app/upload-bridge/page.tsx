import React from "react";
import { decryptToken } from "@/lib/cryptoToken";
import { createClient } from "@supabase/supabase-js";
import { UploadBridgeClient } from "./UploadBridgeClient";
import { AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

interface UploadBridgePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function UploadBridgePage({ searchParams }: UploadBridgePageProps) {
  const token = (await searchParams).token;

  if (!token) {
    return <UploadBridgeError error="Token de carga faltante. Escanea de nuevo el código QR desde tu pantalla principal." />;
  }

  try {
    const payload = decryptToken(token);

    // Validar expiración del token
    if (Date.now() > payload.expiresAt) {
      return <UploadBridgeError error="Este enlace de carga ya expiró. Genera un nuevo código QR en tu pantalla de expedientes." />;
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener información del paciente de forma segura del lado del servidor
    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("first_name, last_name")
      .eq("id", payload.patientId)
      .single();

    if (patientError || !patient) {
      return <UploadBridgeError error="El paciente asociado a este token no fue encontrado o ha sido eliminado." />;
    }

    const patientName = `${patient.first_name} ${patient.last_name}`;

    return <UploadBridgeClient token={token} patientName={patientName} />;

  } catch (err) {
    console.error("[NERVE Upload Bridge Server] Token decryption failed:", err);
    return <UploadBridgeError error="Enlace de carga inválido o corrupto. Por favor, escanea un código QR válido." />;
  }
}

// Pantalla de error responsiva y premium para móviles
function UploadBridgeError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-950/60 border border-slate-900 rounded-3xl p-6 backdrop-blur-2xl shadow-2xl relative z-10 flex flex-col items-center text-center gap-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-md font-bold text-white">No se puede proceder</h3>
          <p className="text-xs text-slate-400 leading-relaxed px-2">
            {error}
          </p>
        </div>
        <div className="w-full border-t border-slate-900 pt-4 text-[10px] text-slate-600">
          NERVE Health Systems
        </div>
      </div>
    </div>
  );
}
