/**
 * POST /api/notifications/welcome
 * Sends welcome email + Telegram notification on new doctor registration
 * 
 * Body: { email, fullName, specialty, phone, licensNumber, university, clinicName, address, plan }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/notifications/email';
import { sendTelegramMessage } from '@/lib/notifications';

function welcomeEmailHTML(data: { fullName: string; clinicName: string; plan: string }): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#050B14;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050B14;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0F1729;border-radius:16px;overflow:hidden;border:1px solid rgba(45,212,191,0.15);">
        <tr><td style="background:linear-gradient(135deg,#0F1729 0%,#142033 100%);padding:40px;text-align:center;border-bottom:1px solid rgba(45,212,191,0.15);">
          <div style="font-size:32px;font-weight:700;color:#2DD4BF;letter-spacing:-0.5px;">NERVE</div>
          <div style="font-size:12px;color:#64748B;margin-top:4px;letter-spacing:1px;text-transform:uppercase;">Health Systems</div>
        </td></tr>
        <tr><td style="padding:40px;">
          <h1 style="margin:0 0 8px;font-size:24px;color:#2DD4BF;">¡Bienvenido, Dr(a). ${data.fullName}! 🎉</h1>
          <p style="margin:0 0 24px;color:#94A3B8;font-size:15px;line-height:1.6;">
            Tu cuenta en NERVE Health Systems ha sido creada exitosamente. Estamos emocionados de tenerte como parte de nuestra comunidad de profesionales de la salud.
          </p>
          
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid rgba(45,212,191,0.1);">
            <tr>
              <td style="padding:14px 16px;background-color:rgba(45,212,191,0.05);color:#94A3B8;font-size:13px;width:140px;border-bottom:1px solid rgba(45,212,191,0.05);">Consultorio</td>
              <td style="padding:14px 16px;color:#E2E8F0;font-size:14px;font-weight:500;border-bottom:1px solid rgba(45,212,191,0.05);">${data.clinicName}</td>
            </tr>
            <tr>
              <td style="padding:14px 16px;background-color:rgba(45,212,191,0.05);color:#94A3B8;font-size:13px;border-bottom:1px solid rgba(45,212,191,0.05);">Plan</td>
              <td style="padding:14px 16px;color:#E2E8F0;font-size:14px;font-weight:500;border-bottom:1px solid rgba(45,212,191,0.05);">${data.plan === 'solo' ? 'Doctor Solo' : 'Clínica'} — 14 días de prueba</td>
            </tr>
            <tr>
              <td style="padding:14px 16px;background-color:rgba(45,212,191,0.05);color:#94A3B8;font-size:13px;">Estado</td>
              <td style="padding:14px 16px;color:#22C55E;font-size:14px;font-weight:600;">✅ Cuenta activa</td>
            </tr>
          </table>

          <div style="margin:32px 0;padding:20px;background:rgba(45,212,191,0.06);border-radius:12px;border:1px solid rgba(45,212,191,0.15);">
            <p style="margin:0 0 12px;color:#2DD4BF;font-size:15px;font-weight:600;">Próximos pasos:</p>
            <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;">1️⃣ Revisa tu perfil en <strong style="color:#E2E8F0;">Configuración</strong></p>
            <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;">2️⃣ Conecta tu <strong style="color:#E2E8F0;">WhatsApp</strong> para notificaciones automáticas</p>
            <p style="margin:0 0 8px;color:#94A3B8;font-size:13px;">3️⃣ Registra tus primeros <strong style="color:#E2E8F0;">pacientes</strong> y agenda citas</p>
            <p style="margin:0;color:#94A3B8;font-size:13px;">4️⃣ Genera <strong style="color:#E2E8F0;">recetas</strong> y expedientes clínicos digitales</p>
          </div>

          <div style="text-align:center;margin:32px 0 0;">
            <a href="https://nervehealthsystems.com/dashboard" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#0D9488,#14B8A6);color:#fff;font-size:14px;font-weight:600;border-radius:12px;text-decoration:none;">Ir a mi Dashboard →</a>
          </div>
        </td></tr>
        <tr><td style="padding:24px 40px;background-color:#0A1120;text-align:center;border-top:1px solid rgba(45,212,191,0.1);">
          <p style="margin:0;font-size:12px;color:#475569;">¿Necesitas ayuda? Responde a este correo y te asistiremos.</p>
          <p style="margin:8px 0 0;font-size:11px;color:#334155;">© ${new Date().getFullYear()} NERVE Health Systems. Todos los derechos reservados.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, specialty, phone, licenseNumber, university, clinicName, address, plan } = body;

    if (!email || !fullName) {
      return NextResponse.json({ error: 'email y fullName requeridos' }, { status: 400 });
    }

    // Security Check: Verify the user actually exists in the database to prevent spam abuse
    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: userRecord } = await supabaseAdmin.from('users').select('created_at').eq('email', email).maybeSingle();
    
    if (!userRecord) {
      console.warn(`[Welcome API] Intento de enviar bienvenida a email no registrado: ${email}`);
      return NextResponse.json({ error: 'Unauthorized: User not found' }, { status: 401 });
    }

    const results: { email: { success: boolean; error?: string }; telegram: { success: boolean } } = { email: { success: false, error: '' }, telegram: { success: false } };

    // 1. Send welcome email
    try {
      results.email = await sendEmail({
        to: email,
        subject: `¡Bienvenido a NERVE Health Systems, Dr(a). ${fullName}! 🎉`,
        html: welcomeEmailHTML({ fullName, clinicName: clinicName || `Consultorio ${fullName}`, plan: plan || 'solo' }),
      });
    } catch (err: any) {
      results.email = { success: false, error: err.message };
    }

    // 2. Send Telegram notification
    try {
      await sendTelegramMessage(
        `🚀 *Nuevo Registro en NERVE*\n\n` +
        `*Doctor:* ${fullName}\n` +
        `*Email:* ${email}\n` +
        `*Teléfono:* ${phone || 'N/A'}\n` +
        `*Especialidad:* ${specialty || 'N/A'}\n` +
        `*Cédula:* ${licenseNumber || 'N/A'}\n` +
        `*Universidad:* ${university || 'N/A'}\n` +
        `*Clínica:* ${clinicName || 'N/A'}\n` +
        `*Dirección:* ${address || 'N/A'}\n` +
        `*Plan:* ${(plan || 'solo').toUpperCase()}\n` +
        `*Fecha:* ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}`
      );
      results.telegram = { success: true };
    } catch {
      results.telegram = { success: false };
    }

    // 3. Send WhatsApp welcome from NERVE platform number
    const waResult = { success: false, error: '' };
    if (phone) {
      const evoUrl = process.env.EVOLUTION_API_URL;
      const nerveToken = process.env.NERVE_WA_INSTANCE_TOKEN;
      if (evoUrl && nerveToken) {
        try {
          const cleanPhone = phone.replace(/\D/g, '');
          const fullPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`;
          
          const waMessage = `👋 *¡Bienvenido a NERVE Health Systems!*\n\n` +
            `Hola Dr(a). ${fullName}, tu cuenta ha sido creada exitosamente.\n\n` +
            `📋 *Tu consultorio:* ${clinicName || 'Sin nombre'}\n` +
            `📌 *Plan:* ${(plan || 'solo') === 'solo' ? 'Doctor Solo' : 'Clínica'}\n` +
            `⏰ *Prueba gratuita:* 14 días\n\n` +
            `🔗 Accede a tu dashboard:\nhttps://nervehealthsystems.com/dashboard\n\n` +
            `_Si tienes dudas, responde a este mensaje y te ayudaremos._\n\n` +
            `_NERVE Health Systems_`;

          const res = await fetch(`${evoUrl}/send/text`, {
            method: 'POST',
            headers: { apikey: nerveToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ number: fullPhone, text: waMessage }),
          });
          const resData = await res.json();
          waResult.success = !resData.error;
          if (resData.error) waResult.error = resData.error;
        } catch (err: any) {
          waResult.error = err.message;
        }
      }
    }

    console.log('[Welcome]', { email, fullName, emailSent: results.email.success, telegram: results.telegram.success, whatsapp: waResult.success });

    return NextResponse.json({ success: true, results: { ...results, whatsapp: waResult } });
  } catch (err: any) {
    console.error('[Welcome] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
