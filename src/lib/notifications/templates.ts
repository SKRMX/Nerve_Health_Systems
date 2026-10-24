/**
 * Templates de notificaciones
 * White-label: Los mensajes se envían a nombre de la clínica/doctor, NO de NERVE.
 */

export interface AppointmentNotificationData {
  patientName: string;
  doctorName: string;
  clinicName: string;
  date: string;        // "16 de abril de 2026"
  time: string;        // "02:40 p.m."
  type: string;        // "Consulta General"
  title: string;       // "Chequeo general"
  teleconsultaUrl?: string; // Jitsi link for teleconsultas
}

// ============================================
// WHATSAPP TEMPLATES (Texto plano con emojis)
// ============================================

export function whatsappConfirmation(data: AppointmentNotificationData): string {
  const videoSection = data.teleconsultaUrl
    ? `\n\n💻 *Enlace de Videollamada:*\n${data.teleconsultaUrl}\n\n_Guarda este link. Lo necesitarás el día de tu cita para unirte a la videollamada._`
    : '';

  return `✅ *Cita Confirmada*

Hola *${data.patientName}*, tu cita ha sido agendada exitosamente.

📋 *Detalles:*
• Doctor(a): ${data.doctorName}
• Fecha: ${data.date}
• Hora: ${data.time}
• Tipo: ${data.type}
• Motivo: ${data.title}
• Consultorio: ${data.clinicName}${videoSection}

Si necesitas reagendar o cancelar, contacta al consultorio.

_${data.clinicName}_`;
}

export function whatsappReschedule(data: AppointmentNotificationData): string {
  return `📅 *Cita Reagendada*

Hola *${data.patientName}*, tu cita ha sido modificada.

📋 *Nuevos detalles:*
• Doctor(a): ${data.doctorName}
• Fecha: ${data.date}
• Hora: ${data.time}
• Tipo: ${data.type}
• Motivo: ${data.title}
• Consultorio: ${data.clinicName}

Si tienes alguna duda, contacta al consultorio.

_${data.clinicName}_`;
}

export function whatsappCancellation(data: AppointmentNotificationData): string {
  return `❌ *Cita Cancelada*

Hola *${data.patientName}*, tu cita ha sido cancelada.

📋 *Detalles de la cita cancelada:*
• Doctor(a): ${data.doctorName}
• Fecha: ${data.date}
• Hora: ${data.time}
• Motivo: ${data.title}

Si deseas reagendar, contacta al consultorio.

_${data.clinicName}_`;
}

export function whatsappReminder24h(data: AppointmentNotificationData): string {
  const videoSection = data.teleconsultaUrl
    ? `\n\n💻 *Tu enlace de Videollamada:*\n${data.teleconsultaUrl}\n\n_Mañana a las ${data.time} entra a este link para tu teleconsulta._`
    : '';

  return `🔔 *Recordatorio de Cita — Mañana*

Hola *${data.patientName}*, te recordamos que tienes una cita *mañana*.

📋 *Detalles:*
• Doctor(a): ${data.doctorName}
• Fecha: ${data.date}
• Hora: ${data.time}
• Tipo: ${data.type}
• Consultorio: ${data.clinicName}${videoSection}

¡Te esperamos! Si necesitas cancelar, avísanos con anticipación.

_${data.clinicName}_`;
}

export function whatsappReminder48h(data: AppointmentNotificationData): string {
  return `🔔 *Recordatorio de Cita*

Hola *${data.patientName}*, te recordamos que tienes una cita en *2 días*.

📋 *Detalles:*
• Doctor(a): ${data.doctorName}
• Fecha: ${data.date}
• Hora: ${data.time}
• Tipo: ${data.type}
• Consultorio: ${data.clinicName}

¡Te esperamos!

_${data.clinicName}_`;
}

export interface PostConsultationData {
  patientName: string;
  doctorName: string;
  clinicName: string;
  diagnosis: string;
  notes?: string;
  medications?: { medication: string; dosage: string; instructions: string }[];
  nextAppointment?: { date: string; time: string };
}

export function whatsappPostConsultation(data: PostConsultationData): string {
  let medsText = '';
  if (data.medications && data.medications.length > 0) {
    medsText = `\n💊 *Medicamentos recetados:*\n` + 
      data.medications.map(m => `• ${m.medication} — ${m.dosage}${m.instructions ? ` (${m.instructions})` : ''}`).join('\n');
  }

  let nextText = '';
  if (data.nextAppointment) {
    nextText = `\n📅 *Próxima cita:*\n• Fecha: ${data.nextAppointment.date}\n• Hora: ${data.nextAppointment.time}`;
  }

  return `📋 *Resumen de Consulta*

Hola *${data.patientName}*, aquí tienes el resumen de tu consulta de hoy con el Dr(a). ${data.doctorName}.

🩺 *Diagnóstico:*
${data.diagnosis}${data.notes ? `\n\n📝 *Indicaciones:*\n${data.notes}` : ''}${medsText}${nextText}

Si tienes alguna duda, no dudes en contactarnos.

_${data.clinicName}_`;
}

// ============================================
// EMAIL TEMPLATES (HTML white-label)
// ============================================

function emailLayout(title: string, content: string, clinicName: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#050B14;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050B14;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#0F1729;border-radius:16px;overflow:hidden;border:1px solid rgba(45,212,191,0.15);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0F1729 0%,#142033 100%);padding:32px 40px;text-align:center;border-bottom:1px solid rgba(45,212,191,0.15);">
              <div style="font-size:24px;font-weight:700;color:#2DD4BF;letter-spacing:-0.5px;">${clinicName}</div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#0A1120;text-align:center;border-top:1px solid rgba(45,212,191,0.1);">
              <p style="margin:0;font-size:12px;color:#475569;">Este mensaje fue enviado automáticamente por ${clinicName}.</p>
              <p style="margin:8px 0 0;font-size:12px;color:#475569;">Si tienes preguntas, contacta al consultorio directamente.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailsTable(data: AppointmentNotificationData): string {
  const rows = [
    { label: 'Doctor(a)', value: data.doctorName },
    { label: 'Fecha', value: data.date },
    { label: 'Hora', value: data.time },
    { label: 'Tipo', value: data.type },
    { label: 'Motivo', value: data.title },
    { label: 'Consultorio', value: data.clinicName },
  ];

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-radius:12px;overflow:hidden;border:1px solid rgba(45,212,191,0.1);">
    ${rows.map(r => `
      <tr>
        <td style="padding:12px 16px;background-color:rgba(45,212,191,0.05);color:#94A3B8;font-size:13px;width:120px;border-bottom:1px solid rgba(45,212,191,0.05);">${r.label}</td>
        <td style="padding:12px 16px;color:#E2E8F0;font-size:14px;font-weight:500;border-bottom:1px solid rgba(45,212,191,0.05);">${r.value}</td>
      </tr>
    `).join('')}
  </table>`;
}

export function emailConfirmation(data: AppointmentNotificationData): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#2DD4BF;">✅ Cita Confirmada</h1>
    <p style="margin:0 0 24px;color:#94A3B8;font-size:15px;">Hola <strong style="color:#E2E8F0;">${data.patientName}</strong>, tu cita ha sido agendada exitosamente.</p>
    ${detailsTable(data)}
    <p style="margin:24px 0 0;color:#64748B;font-size:13px;">Si necesitas reagendar o cancelar tu cita, contacta al consultorio directamente.</p>
  `;
  return {
    subject: `✅ Cita Confirmada — ${data.date} a las ${data.time}`,
    html: emailLayout('Cita Confirmada', content, data.clinicName),
  };
}

export function emailReschedule(data: AppointmentNotificationData): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#F59E0B;">📅 Cita Reagendada</h1>
    <p style="margin:0 0 24px;color:#94A3B8;font-size:15px;">Hola <strong style="color:#E2E8F0;">${data.patientName}</strong>, tu cita ha sido modificada. Aquí están los nuevos detalles:</p>
    ${detailsTable(data)}
    <p style="margin:24px 0 0;color:#64748B;font-size:13px;">Si tienes alguna duda sobre el cambio, contacta al consultorio.</p>
  `;
  return {
    subject: `📅 Cita Reagendada — ${data.date} a las ${data.time}`,
    html: emailLayout('Cita Reagendada', content, data.clinicName),
  };
}

export function emailCancellation(data: AppointmentNotificationData): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#EF4444;">❌ Cita Cancelada</h1>
    <p style="margin:0 0 24px;color:#94A3B8;font-size:15px;">Hola <strong style="color:#E2E8F0;">${data.patientName}</strong>, lamentamos informarte que tu cita ha sido cancelada.</p>
    ${detailsTable(data)}
    <p style="margin:24px 0 0;color:#64748B;font-size:13px;">Si deseas reagendar tu cita, contacta al consultorio directamente.</p>
  `;
  return {
    subject: `❌ Cita Cancelada — ${data.date}`,
    html: emailLayout('Cita Cancelada', content, data.clinicName),
  };
}

export function emailReminder(data: AppointmentNotificationData, hoursAhead: number): { subject: string; html: string } {
  const timeLabel = hoursAhead >= 48 ? 'en 2 días' : 'mañana';
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;color:#2DD4BF;">🔔 Recordatorio de Cita</h1>
    <p style="margin:0 0 24px;color:#94A3B8;font-size:15px;">Hola <strong style="color:#E2E8F0;">${data.patientName}</strong>, te recordamos que tienes una cita <strong style="color:#2DD4BF;">${timeLabel}</strong>.</p>
    ${detailsTable(data)}
    <div style="margin:24px 0 0;padding:16px;background:rgba(45,212,191,0.06);border-radius:8px;border:1px solid rgba(45,212,191,0.15);text-align:center;">
      <p style="margin:0;color:#2DD4BF;font-size:14px;font-weight:600;">¡Te esperamos!</p>
      <p style="margin:4px 0 0;color:#64748B;font-size:12px;">Si necesitas cancelar, avísanos con anticipación.</p>
    </div>
  `;
  return {
    subject: `🔔 Recordatorio: Cita ${timeLabel} — ${data.time}`,
    html: emailLayout('Recordatorio de Cita', content, data.clinicName),
  };
}
