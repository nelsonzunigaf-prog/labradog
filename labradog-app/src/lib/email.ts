/**
 * Email — ÚNICO punto de salida de correo del sistema (regla #12 de
 * project-context.md). Ningún otro archivo importa Resend directamente.
 *
 * En dev (sin `RESEND_API_KEY`) la función es no-op: loguea y retorna, para
 * no romper el flujo local. Mismo patrón defensivo que Sentry sin DSN.
 *
 * Resend free tier: 3.000 emails/mes (suficiente para v1, ver architecture.md
 * addendum FR-041). Plantillas en español de Chile, texto/HTML simple.
 */
import { Resend } from 'resend';

const REMITENTE_POR_DEFECTO = 'Labradog <onboarding@resend.dev>';

type EnviarEmailArgs = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export async function enviarEmail({ to, subject, html, from }: EnviarEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(`[email] RESEND_API_KEY ausente — email a "${to}" NO enviado (no-op): ${subject}`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: from ?? process.env.RESEND_FROM ?? REMITENTE_POR_DEFECTO,
    to,
    subject,
    html,
  });

  if (error) {
    // No filtrar detalles a la UI; el llamador decide cómo degradar.
    throw new Error(`Resend falló al enviar a "${to}": ${error.message}`);
  }
}

/** Plantilla del email de restablecimiento de contraseña (Better Auth provee la URL). */
export function plantillaResetPassword(nombre: string, url: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="font-size: 20px;">Restablece tu contraseña</h1>
      <p>Hola ${nombre},</p>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Labradog.</p>
      <p style="margin: 24px 0;">
        <a href="${url}" style="background:#18181b;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
          Restablecer contraseña
        </a>
      </p>
      <p style="color:#71717a;font-size:14px;">
        Si no fuiste tú, ignora este correo. El enlace vence en 1 hora.
      </p>
    </div>
  `;
}
