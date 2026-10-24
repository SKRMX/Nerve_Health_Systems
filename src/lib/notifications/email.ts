/**
 * Email notifications via Resend
 * https://resend.com/docs
 */
import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('[Email] RESEND_API_KEY no configurada');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    // Use verified domain if available, fallback to resend.dev during verification
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'NERVE Health Systems <soporte@nervehealthsystems.com>';

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('[Email] Error de Resend:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Enviado exitosamente a ${to}, ID: ${data?.id}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[Email] Error:', message);
    return { success: false, error: message };
  }
}
