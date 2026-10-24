import { NextRequest, NextResponse } from "next/server";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

const PLAN_PRICES: Record<string, { amount: number; reason: string }> = {
  solo: { amount: 699, reason: "NERVE — Plan Doctor Solo" },
  clinica: { amount: 4499, reason: "NERVE — Plan Clínica (hasta 10 doctores)" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, email, clinicId } = body;

    const planConfig = PLAN_PRICES[plan];
    if (!planConfig) {
      return NextResponse.json({ error: "Plan no válido" }, { status: 400 });
    }

    // Create a Mercado Pago Preapproval (subscription)
    const preapprovalData = {
      reason: planConfig.reason,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: planConfig.amount,
        currency_id: "MXN",
        free_trial: {
          frequency: 14,
          frequency_type: "days",
        },
      },
      payer_email: email,
      back_url: `${request.nextUrl.origin}/api/checkout/callback?clinic_id=${clinicId}`,
      external_reference: clinicId,
      status: "pending",
    };

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preapprovalData),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("Mercado Pago error:", mpData);
      return NextResponse.json(
        { error: "Error al crear la suscripción", details: mpData },
        { status: 500 }
      );
    }

    return NextResponse.json({
      init_point: mpData.init_point,
      subscription_id: mpData.id,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
