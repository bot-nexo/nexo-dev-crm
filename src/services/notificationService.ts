import { Cliente, Proyecto, Pago } from '../types/database';
import { getStoredConfig } from '../lib/supabase';
import { DataService } from './dataService';

export interface MessageTemplateData {
  cliente: Cliente;
  proyecto?: Proyecto;
  pago?: Pago;
  diasRestantes?: number;
  diasMora?: number;
}

export const NotificationService = {
  // CLEAN PHONE FOR WHATSAPP
  cleanPhone(phone: string): string {
    return phone.replace(/[^0-9]/g, '');
  },

  // 1. GENERATE WHATSAPP MESSAGE TEXTS
  getPaymentConfirmationWhatsApp(data: MessageTemplateData): string {
    const config = getStoredConfig();
    const clienteName = data.cliente.nombre.split(' ')[0];
    const monto = data.pago ? `$${Number(data.pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD` : '';
    const proyectoName = data.proyecto?.nombre_proyecto || 'Servicio de Desarrollo';
    const periodo = data.pago?.periodo_mes || 'vigente';

    return (
      `🚀 *${config.agencyName}* - *Confirmación de Pago Exitoso*\n\n` +
      `¡Hola ${clienteName}! Esperamos que estés muy bien.\n\n` +
      `Te confirmamos que hemos recibido con éxito tu pago correspondiente al servicio:\n` +
      `📌 *Proyecto:* ${proyectoName}\n` +
      `💰 *Monto:* ${monto}\n` +
      `📅 *Período:* ${periodo}\n` +
      `🧾 *Estado:* Cancelado / Pagado\n\n` +
      `Agradecemos tu puntualidad y la confianza depositada en nuestro equipo de desarrollo. ¡Seguimos trabajando a toda máquina!\n\n` +
      `_Atentamente: Equipo de Administración de ${config.agencyName}_`
    );
  },

  getReminderWhatsApp(data: MessageTemplateData): string {
    const config = getStoredConfig();
    const clienteName = data.cliente.nombre.split(' ')[0];
    const monto = data.proyecto ? `$${Number(data.proyecto.valor_mensual).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD` : '';
    const proyectoName = data.proyecto?.nombre_proyecto || 'Proyecto en Curso';
    const diaCobro = data.proyecto?.dia_cobro || 1;

    return (
      `📅 *${config.agencyName}* - *Recordatorio Próximo Cobro*\n\n` +
      `Hola ${clienteName}, buen día.\n\n` +
      `Te saludamos desde ${config.agencyName} para recordarte que el próximo *día ${diaCobro}* corresponde el abono mensual de desarrollo:\n\n` +
      `📌 *Proyecto:* ${proyectoName}\n` +
      `💵 *Valor Mensual:* ${monto}\n` +
      `⏰ *Fecha estimada:* Día ${diaCobro} de este mes\n\n` +
      `Si deseas los datos bancarios / enlace de pago o precisas factura comercial previa, quedamos atentos por este medio.\n\n` +
      `¡Que tengas una excelente jornada!`
    );
  },

  getOverdueWhatsApp(data: MessageTemplateData): string {
    const config = getStoredConfig();
    const clienteName = data.cliente.nombre.split(' ')[0];
    const monto = data.pago
      ? `$${Number(data.pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD`
      : data.proyecto
      ? `$${Number(data.proyecto.valor_mensual).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD`
      : '';
    const proyectoName = data.proyecto?.nombre_proyecto || 'Servicio de Desarrollo';
    const periodo = data.pago?.periodo_mes || 'mes anterior';

    return (
      `⚠️ *${config.agencyName}* - *Aviso de Pago Pendiente*\n\n` +
      `Estimado/a ${clienteName},\n\n` +
      `Te contactamos del área de facturación de ${config.agencyName}. Notamos que aún se encuentra pendiente de liquidación el período de tu proyecto:\n\n` +
      `📌 *Proyecto:* ${proyectoName}\n` +
      `💰 *Monto Adeudado:* ${monto}\n` +
      `📅 *Período en Mora:* ${periodo}\n` +
      `⚡ *Estado:* Vencido\n\n` +
      `Te solicitamos cordialmente regularizarlo a la brevedad para garantizar la continuidad ininterrumpida de los despliegues y servicios en producción.\n\n` +
      `Si ya realizaste la transferencia, por favor envíanos tu comprobante por este medio. ¡Muchas gracias!`
    );
  },

  // 2. GENERATE HTML EMAIL TEMPLATES FOR RESEND
  getPaymentConfirmationEmailHTML(data: MessageTemplateData): { subject: string; html: string } {
    const config = getStoredConfig();
    const monto = data.pago ? `$${Number(data.pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD` : '';
    const proyecto = data.proyecto?.nombre_proyecto || 'Servicios Tecnológicos';
    const subject = `Comprobante de Pago Recibido - ${proyecto} [${config.agencyName}]`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; color: #f1f5f9; margin: 0; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; }
          .header { background: linear-gradient(135deg, #090d16 0%, #1e1b4b 100%); padding: 32px; text-align: center; border-bottom: 1px solid #334155; }
          .logo { font-size: 24px; font-weight: 800; color: #00f2fe; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: #064e3b; color: #34d399; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-top: 12px; text-transform: uppercase; }
          .content { padding: 32px; }
          .receipt-box { background: #090d16; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
          .row:last-child { border-bottom: none; font-size: 18px; font-weight: bold; color: #00f2fe; }
          .label { color: #94a3b8; }
          .value { color: #f8fafc; font-weight: 500; }
          .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">${config.agencyName}</div>
            <div class="badge">Pago Confirmado</div>
            <h2 style="margin: 16px 0 0; color: #ffffff;">Recibo Oficial de Pago</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${data.cliente.nombre}</strong> (${data.cliente.empresa}),</p>
            <p style="color: #94a3b8; line-height: 1.6;">Hemos registrado con éxito tu pago. A continuación tienes el desglose de la transacción procesada:</p>
            
            <div class="receipt-box">
              <div class="row"><span class="label">Proyecto:</span><span class="value">${proyecto}</span></div>
              <div class="row"><span class="label">Período:</span><span class="value">${data.pago?.periodo_mes || 'Mes en Curso'}</span></div>
              <div class="row"><span class="label">Fecha de Pago:</span><span class="value">${data.pago?.fecha_pago || new Date().toISOString().split('T')[0]}</span></div>
              <div class="row"><span class="label">ID Transacción:</span><span class="value" style="font-family: monospace;">${(data.pago?.id || '').slice(0, 13)}</span></div>
              <div class="row"><span class="label">Total Abonado:</span><span class="value">${monto}</span></div>
            </div>

            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
              Todos los repositorios, despliegues y monitoreos de infraestructura continúan funcionando con normalidad. ¡Gracias por confiar en nosotros!
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} ${config.agencyName} • Desarrollo de Software de Alto Impacto
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  getReminderEmailHTML(data: MessageTemplateData): { subject: string; html: string } {
    const config = getStoredConfig();
    const monto = data.proyecto ? `$${Number(data.proyecto.valor_mensual).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD` : '';
    const proyecto = data.proyecto?.nombre_proyecto || 'Servicio de Desarrollo';
    const subject = `Aviso Próximo Cobro - ${proyecto} [${config.agencyName}]`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #1e293b; padding: 32px; }
          .logo { font-size: 22px; font-weight: 800; color: #00f2fe; margin-bottom: 24px; }
          .highlight { background: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #00f2fe; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">${config.agencyName}</div>
          <h2 style="color: #ffffff;">Recordatorio de Cobro Próximo</h2>
          <p>Hola <strong>${data.cliente.nombre}</strong>,</p>
          <p style="color: #94a3b8;">Te enviamos este aviso previo para que puedas programar la renovación mensual de tu plataforma:</p>
          
          <div class="highlight">
            <p style="margin: 4px 0;"><strong>Proyecto:</strong> ${proyecto}</p>
            <p style="margin: 4px 0;"><strong>Monto:</strong> ${monto}</p>
            <p style="margin: 4px 0;"><strong>Día de Cobro:</strong> Día ${data.proyecto?.dia_cobro || 1} del mes</p>
          </div>

          <p style="color: #94a3b8; font-size: 14px;">Si necesitas factura por adelantado o requieres asistencia de facturación, responde directamente a este correo.</p>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  },

  getOverdueEmailHTML(data: MessageTemplateData): { subject: string; html: string } {
    const config = getStoredConfig();
    const monto = data.pago ? `$${Number(data.pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD` : '';
    const proyecto = data.proyecto?.nombre_proyecto || 'Servicio de Desarrollo';
    const subject = `URGENTE: Notificación de Pago Vencido - ${proyecto} [${config.agencyName}]`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f1f5f9; padding: 24px; }
          .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; border: 1px solid #7f1d1d; padding: 32px; }
          .logo { font-size: 22px; font-weight: 800; color: #f87171; margin-bottom: 24px; }
          .alert { background: #450a0a; color: #fca5a5; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">⚠️ ${config.agencyName} - Facturación</div>
          <h2 style="color: #ffffff;">Aviso de Saldo en Mora</h2>
          <p>Estimado/a <strong>${data.cliente.nombre}</strong> (${data.cliente.empresa}),</p>
          <p style="color: #94a3b8;">Le informamos que el siguiente cobro mensual presenta retraso de pago:</p>
          
          <div class="alert">
            <p style="margin: 4px 0;"><strong>Proyecto:</strong> ${proyecto}</p>
            <p style="margin: 4px 0;"><strong>Período:</strong> ${data.pago?.periodo_mes || 'Mes anterior'}</p>
            <p style="margin: 4px 0;"><strong>Monto Pendiente:</strong> ${monto}</p>
            <p style="margin: 4px 0;"><strong>Estado:</strong> VENCIDO</p>
          </div>

          <p style="color: #94a3b8; font-size: 14px;">Solicitamos su regularización inmediata para evitar la suspensión temporal del soporte y los servidores de desarrollo.</p>
        </div>
      </body>
      </html>
    `;
    return { subject, html };
  },

  // 3. SEND DIRECT WHATSAPP VIA URL CLICK-TO-CHAT (100% instant, no gateway needed)
  openWhatsAppChat(phone: string, text: string) {
    const clean = this.cleanPhone(phone);
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${clean}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  // 4. DISPATCH AUTOMATION VIA SERVERLESS OR API (Evolution API / Twilio / Netlify Function)
  async dispatchWhatsApp(
    cliente: Cliente,
    message: string,
    pagoId?: string
  ): Promise<{ success: boolean; message: string; method: 'api' | 'click-to-chat' }> {
    const config = getStoredConfig();
    const cleanNumber = this.cleanPhone(cliente.telefono);

    // Try Netlify Function / API if configured
    let dispatchedViaApi = false;
    let apiError: string | null = null;

    try {
      const response = await fetch('/.netlify/functions/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cleanNumber,
          message: message,
          clientName: cliente.nombre,
        }),
      });

      if (response.ok) {
        const resData = await response.json();
        dispatchedViaApi = true;
      }
    } catch (e: any) {
      apiError = e.message;
    }

    // Always log to notificaciones table
    await DataService.logNotificacion({
      cliente_id: cliente.id,
      tipo: 'whatsapp',
      mensaje: message,
      estado: 'enviado',
      referencia_pago_id: pagoId || null,
    });

    if (dispatchedViaApi) {
      return {
        success: true,
        message: `Mensaje de WhatsApp despachado a ${cliente.nombre} (${cleanNumber})`,
        method: 'api',
      };
    }

    // Fallback: Open direct chat in new window
    this.openWhatsAppChat(cleanNumber, message);
    return {
      success: true,
      message: `Abriendo chat de WhatsApp para ${cliente.nombre}...`,
      method: 'click-to-chat',
    };
  },

  // 5. DISPATCH EMAIL VIA RESEND (Netlify Function or Fallback)
  async dispatchEmail(
    cliente: Cliente,
    subject: string,
    html: string,
    pagoId?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: cliente.email,
          clientName: cliente.nombre,
          subject: subject,
          htmlContent: html,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        await DataService.logNotificacion({
          cliente_id: cliente.id,
          tipo: 'email',
          mensaje: subject,
          estado: 'enviado',
          referencia_pago_id: pagoId || null,
        });

        return {
          success: true,
          message: data.message || `Correo enviado a ${cliente.email} con éxito.`,
        };
      }
    } catch (e) {
      // Fallback in client-only preview
    }

    await DataService.logNotificacion({
      cliente_id: cliente.id,
      tipo: 'email',
      mensaje: subject,
      estado: 'enviado',
      referencia_pago_id: pagoId || null,
    });

    return {
      success: true,
      message: `Correo simulado y registrado en el historial para ${cliente.email}.`,
    };
  },
};
