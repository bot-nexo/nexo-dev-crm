/**
 * Netlify Serverless Function: Send WhatsApp via Evolution API / Twilio
 * Endpoint: /.netlify/functions/send-whatsapp
 */

interface WhatsAppPayload {
  to: string; // E.164 phone format: +54911...
  message: string;
  clientName?: string;
  provider?: 'evolution' | 'twilio';
}

export const handler = async (event: { httpMethod: string; body: string | null }) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido. Utilizar POST.' }),
    };
  }

  try {
    const payload: WhatsAppPayload = JSON.parse(event.body || '{}');
    const { to, message, provider = 'evolution' } = payload;

    if (!to || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan campos requeridos: to, message' }),
      };
    }

    const cleanNumber = to.replace(/[^0-9]/g, '');

    // 1. Evolution API Integration option
    const evoUrl = process.env.EVOLUTION_API_URL;
    const evoKey = process.env.EVOLUTION_API_KEY;
    const evoInstance = process.env.EVOLUTION_INSTANCE_NAME || 'nexo-crm';

    if (evoUrl && evoKey && provider === 'evolution') {
      const evoResponse = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
        method: 'POST',
        headers: {
          'apikey': evoKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: cleanNumber,
          text: message,
          options: {
            delay: 1200,
            presence: 'composing',
          },
        }),
      });

      const evoData = await evoResponse.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          provider: 'evolution',
          data: evoData,
          message: 'WhatsApp enviado exitosamente a través de Evolution API',
        }),
      };
    }

    // 2. Twilio WhatsApp API option
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. "whatsapp:+14155238886"

    if (twilioSid && twilioAuth && twilioFrom && provider === 'twilio') {
      const basicAuth = Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
      const formData = new URLSearchParams();
      formData.append('From', twilioFrom);
      formData.append('To', `whatsapp:+${cleanNumber}`);
      formData.append('Body', message);

      const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const twilioData = await twilioResponse.json();
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          provider: 'twilio',
          data: twilioData,
          message: 'WhatsApp enviado exitosamente vía Twilio API',
        }),
      };
    }

    // Default simulation fallback when API keys are not yet configured on Netlify
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        mocked: true,
        message: 'Modo Simulado: Mensaje despachado para WhatsApp (Configure EVOLUTION_API_KEY o TWILIO_AUTH_TOKEN en Netlify para transmisión en vivo)',
        to: cleanNumber,
        preview: message,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Error al enviar WhatsApp',
      }),
    };
  }
};
