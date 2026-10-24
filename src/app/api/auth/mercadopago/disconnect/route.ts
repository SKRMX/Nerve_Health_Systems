import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("doctor_profiles")
      .update({
        mp_client_id: null,
        mp_access_token: null,
        mp_refresh_token: null
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("[MP Disconnect] DB Error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[MP Disconnect] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
