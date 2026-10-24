import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, amount, clinicId, payer, subscription_tier } = body;

    if (!token || !clinicId) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
    }

    const planName = subscription_tier === "pro" ? "Clínica" : "Doctor Solo";
    
    // 1. Create Subscriptions in MP using the token directly.
    const preapprovalPayload = {
      payer_email: payer.email,
      reason: `NERVE Health Systems - Plan ${planName}`,
      external_reference: clinicId,
      back_url: `https://nervehealthsystems.com/dashboard`, // Not generally used for Custom checkout but required by MP schema sometimes
      card_token_id: token,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "MXN"
      },
      status: "authorized"
    };

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preapprovalPayload),
    });

    const mpData = await mpResponse.json();

    // 2. Handle MP Response
    if (!mpResponse.ok) {
      console.error("Mercado Pago Custom Checkout Error:", mpData);
      
      // Intentar extraer el mensaje amigable si MP lo provee, si no, lanzar texto genérico
      return NextResponse.json(
        { error: mpData.message || "La tarjeta fue rechazada o ocurrió un error." },
        { status: 400 }
      );
    }

    // 3. Success -> Update Supabase Database
    const preapprovalId = mpData.id;
    // By default, MP sets the next billing date one month from now
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: dbError } = await supabaseAdmin
      .from("clinics")
      .update({
        mp_subscription_id: preapprovalId,
        subscription_status: "active",
        current_period_end: periodEnd,
      })
      .eq("id", clinicId);

    if (dbError) {
      console.error("Error actualizando la base de datos", dbError);
      // It charged successfully, but failed to update our DB. In a real scenario, Webhooks would catch this!
    }

    return NextResponse.json({ success: true, subscription_id: preapprovalId });

  } catch (error: any) {
    console.error("Custom checkout route error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
