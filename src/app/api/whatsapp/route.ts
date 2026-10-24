import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const EVO_URL = process.env.EVOLUTION_API_URL || "";
const EVO_GLOBAL_KEY = process.env.EVOLUTION_GLOBAL_API_KEY || "";

async function getAuthUser() {
  const cookieStore = await cookies();
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
  const { data: { user } } = await supabaseAuth.auth.getUser();
  return user;
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function deleteEvolutionInstanceByName(instanceName: string) {
  try {
    // Try /instance/fetchInstances first (Node.js API)
    let allRes = await fetch(`${EVO_URL}/instance/fetchInstances`, {
      headers: { apikey: EVO_GLOBAL_KEY }
    });
    if (!allRes.ok) {
      // Fallback to /instance/all (Go API)
      allRes = await fetch(`${EVO_URL}/instance/all`, {
        headers: { apikey: EVO_GLOBAL_KEY }
      });
    }
    if (allRes.ok) {
      const allData = await allRes.json();
      const list = Array.isArray(allData) ? allData : allData?.data;
      if (Array.isArray(list)) {
        const existing = list.find((inst: any) => 
          inst.name === instanceName || 
          inst.instanceName === instanceName ||
          inst.instance?.name === instanceName
        );
        if (existing) {
          const nameToUse = existing.name || existing.instanceName || instanceName;
          console.log(`[WA] Deleting instance ${instanceName} by name: ${nameToUse}`);
          await fetch(`${EVO_URL}/instance/delete/${nameToUse}`, {
            method: "DELETE",
            headers: { apikey: EVO_GLOBAL_KEY }
          });

          if (existing.id && existing.id !== nameToUse) {
            console.log(`[WA] Deleting instance ${instanceName} by ID: ${existing.id}`);
            await fetch(`${EVO_URL}/instance/delete/${existing.id}`, {
              method: "DELETE",
              headers: { apikey: EVO_GLOBAL_KEY }
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[WA] Error in deleteEvolutionInstanceByName:", e);
  }
}

// POST: Create instance + connect → returns QR
export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("users")
      .select("clinic_id, role")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id || !["admin", "superadmin"].includes(profile.role)) {
      return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
    }

    const instanceName = `nerve-${profile.clinic_id.slice(0, 8)}`;
    const instanceToken = `tok-${profile.clinic_id.slice(0, 12)}-${Date.now()}`;

    // Delete existing instance to avoid conflicts and token mismatches
    await deleteEvolutionInstanceByName(instanceName);

    // 1. Create instance in Evolution Go
    const createRes = await fetch(`${EVO_URL}/instance/create`, {
      method: "POST",
      headers: { apikey: EVO_GLOBAL_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ 
        name: instanceName, 
        instanceName: instanceName, 
        token: instanceToken,
        integration: "WHATSAPP-BAILEYS"
      }),
    });
    const createData = await createRes.json();

    if (createData?.error) {
      console.log("[WA] Create response:", createData);
    }

    const token = createData?.data?.token || instanceToken;

    // 2. Connect (starts WhatsApp session)
    await fetch(`${EVO_URL}/instance/connect`, {
      method: "POST",
      headers: { apikey: token, "Content-Type": "application/json" },
      body: JSON.stringify({ name: instanceName }),
    });

    // 3. Get QR code
    const qrRes = await fetch(`${EVO_URL}/instance/qr`, {
      headers: { apikey: token },
    });
    const qrData = await qrRes.json();
    const qrBase64 = qrData?.data?.Qrcode || qrData?.data?.qrcode || null;

    // 4. Save to DB
    await supabase
      .from("clinics")
      .update({ wa_instance_name: instanceName, wa_instance_token: token, wa_connected: false })
      .eq("id", profile.clinic_id);

    return NextResponse.json({ success: true, instanceName, qr: qrBase64 });
  } catch (err: any) {
    console.error("[WA POST]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET: Check status / get QR
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id) return NextResponse.json({ error: "Sin clínica" }, { status: 400 });

    const { data: clinic } = await supabase
      .from("clinics")
      .select("wa_instance_name, wa_instance_token, wa_connected, wa_phone")
      .eq("id", profile.clinic_id)
      .single();

    if (!clinic?.wa_instance_name || !clinic?.wa_instance_token) {
      return NextResponse.json({ status: "not_configured" });
    }

    // Check instance status using global key
    const statusRes = await fetch(`${EVO_URL}/instance/connectionState/${clinic.wa_instance_name}`, {
      headers: { apikey: EVO_GLOBAL_KEY },
    });
    
    let connected = false;
    let qrBase64 = null;
    let statusData: any = {};
    
    try {
      statusData = await statusRes.json();
    } catch (e) {}

    // Self-healing: if the instance doesn't exist in the Evolution container, recreate it automatically
    const isNotFound = statusRes.status === 404 || 
                       statusData?.status === 404 || 
                       statusData?.error === "Not Found" ||
                       statusData?.error === "instance not found" || 
                       statusData?.response?.message?.[0]?.includes("does not exist") ||
                       (statusData?.message && String(statusData.message).toLowerCase().includes("not found"));

    if (isNotFound) {
      console.log(`[WA GET] Instance ${clinic.wa_instance_name} not found in Evolution API. Recreating...`);
      
      // Delete just in case to clean up
      await deleteEvolutionInstanceByName(clinic.wa_instance_name);

      // Create instance
      await fetch(`${EVO_URL}/instance/create`, {
        method: "POST",
        headers: { apikey: EVO_GLOBAL_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: clinic.wa_instance_name, 
          instanceName: clinic.wa_instance_name, 
          token: clinic.wa_instance_token,
          integration: "WHATSAPP-BAILEYS"
        }),
      }).catch(() => {});
      
      // Connect / Get QR (Node.js style GET /instance/connect/:name first)
      let qrRes = await fetch(`${EVO_URL}/instance/connect/${clinic.wa_instance_name}`, {
        headers: { apikey: EVO_GLOBAL_KEY }
      });
      
      // Fallback for Go version if GET connect fails
      if (!qrRes.ok) {
        await fetch(`${EVO_URL}/instance/connect`, {
          method: "POST",
          headers: { apikey: EVO_GLOBAL_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ name: clinic.wa_instance_name }),
        }).catch(() => {});

        qrRes = await fetch(`${EVO_URL}/instance/qr`, {
          headers: { apikey: EVO_GLOBAL_KEY },
        });
      }

      const qrData = await qrRes.json();
      qrBase64 = qrData?.base64 || qrData?.qrcode?.base64 || qrData?.data?.Qrcode || qrData?.data?.qrcode || null;
    } else {
      const state = statusData?.instance?.state || statusData?.data?.state;
      const isConnected = statusData?.data?.Connected === true || state === "open" || state === "connected";
      const isLoggedIn = statusData?.data?.LoggedIn === true || state === "open" || state === "connected";
      connected = isConnected && isLoggedIn;

      // Get QR if not fully connected
      if (!connected) {
        // Connect / Get QR (Node.js style GET /instance/connect/:name first)
        let qrRes = await fetch(`${EVO_URL}/instance/connect/${clinic.wa_instance_name}`, {
          headers: { apikey: EVO_GLOBAL_KEY }
        });

        // Fallback for Go version if GET connect fails
        if (!qrRes.ok) {
          await fetch(`${EVO_URL}/instance/connect`, {
            method: "POST",
            headers: { apikey: EVO_GLOBAL_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({ name: clinic.wa_instance_name }),
          }).catch(() => {});

          qrRes = await fetch(`${EVO_URL}/instance/qr`, {
            headers: { apikey: EVO_GLOBAL_KEY },
          });
        }

        const qrData = await qrRes.json();
        qrBase64 = qrData?.base64 || qrData?.qrcode?.base64 || qrData?.data?.Qrcode || qrData?.data?.qrcode || null;
      }
    }

    // Update DB if state changed
    if (connected !== clinic.wa_connected) {
      const jidName = statusData?.data?.Name || "";
      await supabase
        .from("clinics")
        .update({ wa_connected: connected, wa_phone: jidName || null })
        .eq("id", profile.clinic_id);
    }

    return NextResponse.json({
      status: connected ? "connected" : clinic.wa_instance_name ? "waiting_qr" : "not_configured",
      connected,
      phone: clinic.wa_phone,
      instanceName: clinic.wa_instance_name,
      qr: qrBase64,
    });
  } catch (err: any) {
    console.error("[WA GET]", err);
    return NextResponse.json({ error: err.message, status: "not_configured" });
  }
}

// DELETE: Disconnect + delete instance
export async function DELETE() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const supabase = getSupabaseAdmin();
    const { data: profile } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (!profile?.clinic_id) return NextResponse.json({ error: "Sin clínica" }, { status: 400 });

    const { data: clinic } = await supabase
      .from("clinics")
      .select("wa_instance_name, wa_instance_token")
      .eq("id", profile.clinic_id)
      .single();

    if (clinic?.wa_instance_name) {
      // Logout
      await fetch(`${EVO_URL}/instance/logout`, {
        method: "DELETE",
        headers: { apikey: clinic.wa_instance_token || EVO_GLOBAL_KEY },
      }).catch(() => {});

      // Delete by name using UUID search
      await deleteEvolutionInstanceByName(clinic.wa_instance_name);
    }

    await supabase
      .from("clinics")
      .update({ wa_instance_name: null, wa_instance_token: null, wa_connected: false, wa_phone: null })
      .eq("id", profile.clinic_id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
