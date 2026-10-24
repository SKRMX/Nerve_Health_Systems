import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get("clinic_id");
  const preapprovalId = searchParams.get("preapproval_id");

  if (clinicId && preapprovalId) {
    // Update the clinic with the MP subscription ID
    await supabaseAdmin
      .from("clinics")
      .update({
        mp_subscription_id: preapprovalId,
        subscription_status: "trialing",
        current_period_end: new Date(
          Date.now() + 14 * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq("id", clinicId);
  }

  // Redirect to the dashboard
  const dashboardUrl = new URL("/dashboard", request.nextUrl.origin);
  return NextResponse.redirect(dashboardUrl);
}
