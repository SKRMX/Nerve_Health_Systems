import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Contiene el user_id (doctor_id) del perfil
    const errorMsg = searchParams.get("error");

    if (errorMsg) {
      console.error("[MP OAuth Callback] Error redirect:", errorMsg);
      return NextResponse.redirect(new URL("/dashboard/configuracion?mp_error=auth_failed", request.url));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL("/dashboard/configuracion?mp_error=missing_params", request.url));
    }

    // Intercambiar el código por el access token
    // Usamos el MP_ACCESS_TOKEN de la plataforma como client_secret y el CLIENT_ID de la app
    const clientId = process.env.MP_CLIENT_ID || process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.split("-")[1] || "";
    const clientSecret = process.env.MP_ACCESS_TOKEN || "";

    const mpResponse = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: new URLSearchParams({
        client_secret: clientSecret,
        client_id: clientId,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: `${request.nextUrl.origin}/api/auth/mercadopago/callback`
      })
    });

    if (!mpResponse.ok) {
      const errBody = await mpResponse.text();
      console.error("[MP OAuth Callback] Token exchange failed:", errBody);
      return NextResponse.redirect(new URL("/dashboard/configuracion?mp_error=token_exchange_failed", request.url));
    }

    const data = await mpResponse.json();

    // Guardar credenciales en doctor_profiles
    const { error: dbError } = await supabaseAdmin
      .from("doctor_profiles")
      .update({
        mp_client_id: String(data.user_id),
        mp_access_token: data.access_token,
        mp_refresh_token: data.refresh_token
      })
      .eq("user_id", state);

    if (dbError) {
      console.error("[MP OAuth Callback] DB Update error:", dbError.message);
      return NextResponse.redirect(new URL("/dashboard/configuracion?mp_error=db_save_failed", request.url));
    }

    console.log(`[MP OAuth Callback] Doctor ${state} connected successfully to Mercado Pago.`);

    // Redirigir al dashboard con indicador de éxito
    return NextResponse.redirect(new URL("/dashboard/configuracion?mp_connected=true", request.url));
  } catch (error: any) {
    console.error("[MP OAuth Callback] Unhandled error:", error);
    return NextResponse.redirect(new URL("/dashboard/configuracion?mp_error=server_error", request.url));
  }
}
