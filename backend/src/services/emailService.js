const https = require('https');

/**
 * Envía el OTP de recuperación de contraseña usando la REST API de Brevo directamente.
 * No depende del SDK @getbrevo/brevo — evita problemas de versión.
 * @param {{ to: string, otp: string, userName: string }} params
 */
async function sendOtpEmail({ to, otp, userName }) {
    if (!process.env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY no está configurada');
    }

    const senderName  = process.env.BREVO_SENDER_NAME  || 'Jrepuestos Medellín';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || '';

    if (!senderEmail) {
        throw new Error('BREVO_SENDER_EMAIL no está configurada');
    }

    const payload = JSON.stringify({
        sender:  { name: senderName, email: senderEmail },
        to:      [{ email: to }],
        subject: 'Código de recuperación de contraseña — Jrepuestos',
        htmlContent: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <tr><td style="background:#1d4ed8;padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${senderName}</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Sistema de Gestión</p>
        </td></tr>

        <tr><td style="padding:32px;">
          <p style="margin:0 0 16px;color:#374151;font-size:15px;">
            Hola <strong>${userName}</strong>,
          </p>
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
            &#9200; Este código expira en <strong>10 minutos</strong>.
          </p>
          <p style="margin:0 0 24px;color:#6b7280;font-size:13px;text-align:center;">
            Si no solicitaste este código, ignora este mensaje.
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            Por seguridad, nunca compartas este código con nadie.<br>
            ${senderName}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.brevo.com',
            port:     443,
            path:     '/v3/smtp/email',
            method:   'POST',
            headers:  {
                'Content-Type':   'application/json',
                'api-key':        process.env.BREVO_API_KEY,
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const body = JSON.parse(data);
                        console.log(`[Brevo] Email enviado a ${to} — messageId: ${body.messageId || 'OK'}`);
                        resolve(body);
                    } catch {
                        resolve({ messageId: 'OK' });
                    }
                } else {
                    const err = new Error(`Brevo API error ${res.statusCode}: ${data}`);
                    err.response = { statusCode: res.statusCode, body: data };
                    reject(err);
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

/**
 * Notifica al cliente que su pedido fue completado y está listo.
 * @param {{ to: string, nombre: string, numeroPedido: number, fecha: string }} params
 */
async function sendPedidoCompletadoEmail({ to, nombre, numeroPedido, fecha }) {
    if (!process.env.BREVO_API_KEY) {
        console.error('[Email] BREVO_API_KEY no configurada — email de pedido completado no enviado');
        return;
    }

    const senderName  = process.env.BREVO_SENDER_NAME  || 'Jrepuestos Medellín';
    const senderEmail = process.env.BREVO_SENDER_EMAIL || '';

    if (!senderEmail) {
        console.error('[Email] BREVO_SENDER_EMAIL no configurada');
        return;
    }

    const payload = JSON.stringify({
        sender:  { name: senderName, email: senderEmail },
        to:      [{ email: to }],
        subject: `Tu pedido #${numeroPedido} ha sido completado — ${senderName}`,
        htmlContent: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <tr><td style="background:#1d4ed8;padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${senderName}</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Sistema de Gestión</p>
        </td></tr>

        <tr><td style="padding:32px;">

          <div style="text-align:center;margin-bottom:24px;">
            <div style="display:inline-block;background:#dcfce7;border-radius:50%;width:64px;height:64px;
                        line-height:64px;font-size:32px;">✅</div>
          </div>

          <h2 style="margin:0 0 16px;color:#111827;font-size:20px;text-align:center;">
            ¡Tu pedido está listo!
          </h2>

          <p style="margin:0 0 16px;color:#374151;font-size:15px;">
            Hola <strong>${nombre}</strong>,
          </p>
          <p style="margin:0 0 24px;color:#374151;font-size:15px;">
            Te informamos que tu pedido ha sido completado exitosamente
            y ya se encuentra listo para el siguiente proceso.
          </p>

          <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:6px;
                      padding:16px 20px;margin:0 0 24px;">
            <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;
                       letter-spacing:.05em;font-weight:600;">Número de pedido</p>
            <p style="margin:0;color:#1d4ed8;font-size:28px;font-weight:800;
                       font-family:monospace;">#${numeroPedido}</p>
            <p style="margin:6px 0 0;color:#6b7280;font-size:13px;">
              Fecha de finalización: <strong>${fecha}</strong>
            </p>
          </div>

          <p style="margin:0 0 24px;color:#374151;font-size:15px;">
            Gracias por confiar en nosotros. Puedes comunicarte con nosotros si tienes
            alguna pregunta sobre tu pedido.
          </p>

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            ${senderName} · jrepuestosmed@hotmail.com<br>
            Cra 70a #94-18 · 3044470797 - 3008287819
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.brevo.com',
            port:     443,
            path:     '/v3/smtp/email',
            method:   'POST',
            headers:  {
                'Content-Type':   'application/json',
                'api-key':        process.env.BREVO_API_KEY,
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const body = JSON.parse(data);
                        console.log(`[Brevo] Email pedido completado enviado a ${to} — messageId: ${body.messageId || 'OK'}`);
                        resolve(body);
                    } catch {
                        resolve({ messageId: 'OK' });
                    }
                } else {
                    const err = new Error(`Brevo API error ${res.statusCode}: ${data}`);
                    err.response = { statusCode: res.statusCode, body: data };
                    reject(err);
                }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

module.exports = { sendOtpEmail, sendPedidoCompletadoEmail };
