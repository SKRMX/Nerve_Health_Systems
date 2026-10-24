import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // 1. Verify that the user is logged in
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // 2. Check if the user has the 'superadmin' role in the 'users' table
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "superadmin") {
      return NextResponse.json({ error: "Acceso denegado: Se requiere rol superadmin" }, { status: 403 });
    }

    // 3. Process the superadmin request
    const body = await request.json();
    const { clinicId, action, months, tier, status } = body;

    if (!clinicId) {
      return NextResponse.json({ error: "Falta clinicId" }, { status: 400 });
    }

    // Get current clinic details
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from("clinics")
      .select("*")
      .eq("id", clinicId)
      .single();

    if (clinicError || !clinic) {
      return NextResponse.json({ error: "Clínica no encontrada" }, { status: 404 });
    }

    let updateFields: any = {};

    if (action === "gift_months") {
      if (!months || isNaN(months)) {
        return NextResponse.json({ error: "Cantidad de meses no válida" }, { status: 400 });
      }

      // Calculate new period end
      let currentEnd = clinic.current_period_end ? new Date(clinic.current_period_end) : new Date();
      // If current end is in the past, start gifting from today
      if (currentEnd < new Date()) {
        currentEnd = new Date();
      }
      
      currentEnd.setMonth(currentEnd.getMonth() + Number(months));
      
      updateFields = {
        subscription_status: "active",
        current_period_end: currentEnd.toISOString(),
      };
    } else if (action === "update_subscription") {
      if (tier) updateFields.subscription_tier = tier;
      if (status) {
        updateFields.subscription_status = status;
        if (status === "expired" || status === "canceled") {
          // If marking as expired or canceled, set current period end to yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          updateFields.current_period_end = yesterday.toISOString();
        } else if (status === "active" && !clinic.current_period_end) {
          // If activating and has no period end, set 1 month from now
          const oneMonth = new Date();
          oneMonth.setMonth(oneMonth.getMonth() + 1);
          updateFields.current_period_end = oneMonth.toISOString();
        }
      }
    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    // 4. Update clinic
    const { error: updateError } = await supabaseAdmin
      .from("clinics")
      .update(updateFields)
      .eq("id", clinicId);

    if (updateError) {
      console.error("[Superadmin API] Error updating clinic:", updateError);
      return NextResponse.json({ error: "Error al actualizar la base de datos" }, { status: 500 });
    }

    return NextResponse.json({ success: true, updatedFields: updateFields });
  } catch (error: any) {
    console.error("[Superadmin API] Unexpected error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
