const nodemailer = require('nodemailer');

/**
 * Transporter de Nodemailer configurado con Gmail.
 * Lee las credenciales desde variables de entorno — nunca hardcodeadas.
 */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

/**
 * Envía el OTP de recuperación de contraseña al email del usuario.
 * @param {{ to: string, otp: string, userName: string }} params
 */
async function sendOtpEmail({ to, otp, userName }) {
    await transporter.sendMail({
        from: `"Jrepuestos Medellín" <${process.env.GMAIL_USER}>`,
        to,
        subject: 'Código de recuperación de contraseña — Jrepuestos',
        html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <tr><td style="background:#1d4ed8;padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Jrepuestos Medellín</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Sistema de Gestión</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;">Hola <strong>${userName}</strong>,</p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta.
            Usa el siguiente código de verificación:
          </p>
          <div style="background:#eff6ff;border:2px dashed #3b82f6;border-radius:10px;
                      padding:24px;text-align:center;margin:0 0 24px;">
            <span style="font-size:42px;font-weight:800;letter-spacing:14px;
                         color:#1d4ed8;font-family:monospace;">${otp}</span>
          </div>
          <p style="margin:0 0 8px;color:#6b7280;font-size:13px;text-align:center;">
            ⏱ Este código expira en <strong>10 minutos</strong>.
          </p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:13px;text-align:center;">
            Si no solicitaste este código, ignora este mensaje.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Por seguridad, nunca compartas este código con nadie.<br>
            Jrepuestos Medellín
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
}

module.exports = { sendOtpEmail };
