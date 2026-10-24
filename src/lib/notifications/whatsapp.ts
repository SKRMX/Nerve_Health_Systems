/**
 * WhatsApp notifications via Evolution Go API
 * Multi-tenant: Each clinic has its own WhatsApp instance
 */
import { createClient } from "@supabase/supabase-js";

import { getCountryConfig } from "../international";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Normaliza un número de teléfono de cualquier país para Evolution Go.
 */
export function normalizePhoneNumber(phone: string, country?: string | null): string {
  let cleaned = phone.replace(/\D/g, '');
  const config = getCountryConfig(country);
  const prefix = config.phonePrefix;

  // Si ya empieza con el prefijo correcto y tiene la longitud adecuada, lo devolvemos
  if (cleaned.startsWith(prefix) && cleaned.length >= 11) {
    return cleaned;
  }

  // Caso especial para México (el 521 en móviles)
  if (prefix === '52' && cleaned.startsWith('521') && cleaned.length === 13) {
    cleaned = '52' + cleaned.slice(3);
  } else if (cleaned.length === 10) {
    cleaned = `${prefix}${cleaned}`;
  }

  return cleaned;
}

interface SendWhatsAppParams {
  to: string;
  message: string;
  clinicId: string;
}

/**
 * Sends a WhatsApp text message via the clinic's own Evolution Go instance.
 * Evolution API v2: POST /message/sendText/{instanceName}
 */
export async function sendWhatsApp({ to, message, clinicId }: SendWhatsAppParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // Get the clinic's WhatsApp config (instance name required for URL)
    const { data: clinic, error: clinicErr } = await supabase
      .from('clinics')
      .select('wa_instance_name, wa_instance_token, wa_connected, name, country_code')
      .eq('id', clinicId)
      .single();

    let instanceName = clinic?.wa_instance_name;
    let instanceToken = clinic?.wa_instance_token;

    if (!clinic?.wa_connected || !instanceName || !instanceToken) {
      console.warn(`[WhatsApp] ${clinic?.name || clinicId}: WhatsApp propio no conectado. Buscando instancia activa del sistema...`);
      const { data: fallbackClinic } = await supabase
        .from('clinics')
        .select('wa_instance_name, wa_instance_token')
        .eq('wa_connected', true)
        .not('wa_instance_name', 'is', null)
        .limit(1)
        .single();

      if (fallbackClinic && fallbackClinic.wa_instance_name && fallbackClinic.wa_instance_token) {
        instanceName = fallbackClinic.wa_instance_name;
        instanceToken = fallbackClinic.wa_instance_token;
        console.log(`[WhatsApp] Usando instancia del sistema (${instanceName}) para envío.`);
      } else {
        return { success: false, error: 'Sin instancias de WhatsApp disponibles' };
      }
    }

    const toNumber = normalizePhoneNumber(to, clinic?.country_code);

    // Evolution API v2 correct endpoint with instanceName in path
    const url = `${EVOLUTION_API_URL}/message/sendText/${instanceName}`;

    console.log(`[WhatsApp] Enviando a ${toNumber} vía instancia ${instanceName} → ${url}`);

    const globalKey = process.env.EVOLUTION_GLOBAL_API_KEY || "";
    const apiKeyToUse = instanceToken || globalKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKeyToUse
      },
      body: JSON.stringify({
        number: toNumber,
        text: message
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg = result?.message || result?.error || `HTTP ${response.status}`;
      console.error(`[WhatsApp] Error en ${clinic.name} (${response.status}):`, JSON.stringify(result));
      return { success: false, error: errorMsg };
    }

    console.log(`[WhatsApp] ✅ Enviado a ${toNumber} vía ${clinic.name}`);
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[WhatsApp] Error:', errorMsg);
    return { success: false, error: errorMsg };
  }
}
