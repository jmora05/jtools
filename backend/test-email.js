require('dotenv').config();
const brevo = require('@getbrevo/brevo');

const TO = process.argv[2] || process.env.BREVO_SENDER_EMAIL;

async function test() {
    console.log('--- BREVO EMAIL TEST ---');
    console.log('API Key:', process.env.BREVO_API_KEY ? process.env.BREVO_API_KEY.slice(0, 20) + '...' : 'NO CONFIGURADA');
    console.log('Sender :', process.env.BREVO_SENDER_EMAIL || 'NO CONFIGURADA');
    console.log('Destino:', TO);
    console.log('');

    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
        console.error('Faltan variables de entorno. Revisa el .env');
        process.exit(1);
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender      = { name: process.env.BREVO_SENDER_NAME || 'Test', email: process.env.BREVO_SENDER_EMAIL };
    sendSmtpEmail.to          = [{ email: TO }];
    sendSmtpEmail.subject     = 'Test Brevo — Jrepuestos';
    sendSmtpEmail.htmlContent = '<p>Email de prueba. Si lo ves, Brevo está funcionando correctamente.</p>';

    try {
        const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log('✅ Email enviado correctamente!');
        console.log('MessageId:', result?.body?.messageId || JSON.stringify(result?.body || result));
    } catch (err) {
        console.error('❌ Error al enviar:');
        console.error('  Status :', err?.response?.statusCode || err?.status);
        console.error('  Message:', err?.response?.body?.message || err?.message);
        console.error('  Body   :', JSON.stringify(err?.response?.body || {}));
    }
}

test();
