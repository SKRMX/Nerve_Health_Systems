import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/notifications";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // 1. Authenticate user session
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

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Fetch profile using service role to obtain clinic_id and role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const clinicId = profile.clinic_id;
    if (!clinicId) {
      return NextResponse.json({ error: "El usuario no pertenece a ninguna clínica" }, { status: 400 });
    }

    // 3. Fetch clinic to check subscription state
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("*")
      .eq("id", clinicId)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 });
    }

    const { mp_subscription_id, subscription_status } = clinic;

    // Check if subscription exists and is active/trialing
    if (!mp_subscription_id) {
      return NextResponse.json({ error: "No hay ninguna suscripción activa registrada para cancelar." }, { status: 400 });
    }

    // 4. Request cancellation in Mercado Pago
    console.log(`[NERVE Cancel] Requesting cancellation for subscription: ${mp_subscription_id}`);
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${mp_subscription_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        status: "cancelled"
      })
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("[NERVE Cancel] MP Cancellation failed:", mpData);
      return NextResponse.json({ 
        error: mpData.message || "Error al cancelar la suscripción en el proveedor de pagos." 
      }, { status: mpResponse.status });
    }

    // 5. Update local database state to canceled
    const { error: dbError } = await supabaseAdmin
      .from("clinics")
      .update({
        subscription_status: "canceled"
      })
      .eq("id", clinicId);

    if (dbError) {
      console.error("[NERVE Cancel] Database update failed:", dbError);
    }

    // 6. Notify Telegram about cancellation
    try {
      await sendTelegramMessage(
        `⛔ *Suscripción Cancelada*\n\n` +
        `*Clínica:* \`${clinic.name}\`\n` +
        `*ID Clínica:* \`${clinicId}\`\n` +
        `*Usuario:* \`${profile.first_name} ${profile.last_name}\` (${profile.email})\n` +
        `*ID Suscripción:* \`${mp_subscription_id}\``
      );
    } catch (teleErr) {
      console.error("[NERVE Cancel] Telegram notification failed:", teleErr);
    }

    return NextResponse.json({ success: true, message: "Suscripción cancelada exitosamente." });

  } catch (error: any) {
    console.error("[NERVE Cancel] Unexpected error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
