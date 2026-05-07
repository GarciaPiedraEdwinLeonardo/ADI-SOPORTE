// backend/src/services/email.service.js
// Brevo (ex-Sendinblue) — API REST directa, sin SDK
// Gratis: 300 emails/día, sin tarjeta de crédito
// Variables de entorno necesarias:
//   BREVO_API_KEY   → Settings → SMTP & API → API Keys
//   EMAIL_FROM      → email verificado en Brevo (Senders & IPs)
//   FRONTEND_URL    → ej. https://soporte.adi.mx  (sin slash final)

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

/**
 * Envía un email transaccional usando la API REST de Brevo.
 * @param {{ to: string, toName: string, subject: string, html: string }} opts
 */
export const sendEmail = async ({ to, toName, subject, html }) => {
  const res = await fetch(BREVO_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "Soporte ADI",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Brevo error ${res.status}: ${body}`);
  }
};

/**
 * Email de recuperación de contraseña.
 * @param {{ email: string, name: string, token: string }} opts
 */
export const sendPasswordResetEmail = async ({ email, name, token }) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Recuperar contraseña</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;
                      box-shadow:0 2px 8px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:#1a56db;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;
                         letter-spacing:.5px;">
                Soporte ADI
              </h1>
              <p style="margin:6px 0 0;color:#bfdbfe;font-size:13px;">
                Sistema de Incidencias
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 12px;font-size:15px;color:#374151;">
                Hola, <strong>${name}</strong>
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                Haz clic en el botón para continuar. Este enlace es válido por
                <strong>1 hora</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:#1a56db;border-radius:6px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;padding:14px 32px;
                              color:#ffffff;font-size:15px;font-weight:600;
                              text-decoration:none;letter-spacing:.3px;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0 0 28px;font-size:12px;word-break:break-all;">
                <a href="${resetUrl}" style="color:#1a56db;">${resetUrl}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>

              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                Si no solicitaste este cambio, puedes ignorar este correo.
                Tu contraseña no será modificada.<br/>
                Por seguridad, no compartas este enlace con nadie.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;
                       border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} ADI · Sistema de Incidencias
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: email,
    toName: name,
    subject: "🔐 Recupera tu contraseña — Soporte ADI",
    html,
  });
};
