/**
 * Netlify Serverless Function: Send Email via Resend
 * Endpoint: /.netlify/functions/send-email
 */

interface SendEmailPayload {
  to: string;
  clientName: string;
  subject: string;
  htmlContent: string;
  invoiceData?: {
    projectName: string;
    amount: number;
    period: string;
    dueDate?: string;
    receiptNumber?: string;
  };
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
    const payload: SendEmailPayload = JSON.parse(event.body || '{}');
    const { to, clientName, subject, htmlContent } = payload;

    if (!to || !subject || !htmlContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan campos requeridos: to, subject, htmlContent' }),
      };
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      // In sandbox/preview mode, respond gracefully so the app can function cleanly
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          mocked: true,
          message: 'Modo Simulado: Correo despachado exitosamente (Para envío real configure RESEND_API_KEY en Netlify)',
          recipient: to,
          subject,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    // Call Resend REST API directly without heavy external npm module dependencies
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Nexo Dev Studio <cobros@nexodevstudio.com>',
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    const responseData = await resendResponse.json();

    if (!resendResponse.ok) {
      throw new Error(responseData?.message || 'Error en respuesta de Resend API');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        data: responseData,
        message: 'Correo enviado exitosamente vía Resend',
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message || 'Error interno al enviar correo',
      }),
    };
  }
};
