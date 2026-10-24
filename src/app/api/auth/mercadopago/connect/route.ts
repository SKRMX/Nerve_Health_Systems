import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const clientId = process.env.MP_CLIENT_ID || process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.split("-")[1] || "";
    const redirectUri = `${request.nextUrl.origin}/api/auth/mercadopago/callback`;
    const state = user.id; // Guardamos el user_id para asociarlo al perfil al regresar

    const authUrl = `https://auth.mercadopago.com/authorization?client_id=${clientId}&response_type=code&platform_id=mp&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[MP Connect] Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
