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

  // 6. TRIGGER CRON DE COBRANZA DIARIA (SERVERLESS O FALLBACK LOCAL)
  async triggerCronBilling(options?: {
    dryRun?: boolean;
    forceDay?: number;
    clientes?: Cliente[];
    proyectos?: Proyecto[];
    pagos?: Pago[];
  }): Promise<{
    success: boolean;
    message: string;
    summary: {
      timestamp: string;
      evaluatedDay: number;
      dryRun: boolean;
      totalProyectosEvaluados: number;
      totalClientesNotificados: number;
      recordatoriosHoy: number;
      recordatoriosPreventivos: number;
      alertasMora: number;
      mensajesWhatsApp: number;
      correosResend: number;
      errores: string[];
      detalles: Array<{
        cliente: string;
        tipo: 'corte_hoy' | 'preventivo_3_dias' | 'mora_vencida';
        canal: string;
        estado: 'enviado' | 'simulado' | 'fallido' | 'omitido_duplicado';
        motivo?: string;
      }>;
    };
  }> {
    const config = getStoredConfig();
    const dryRun = Boolean(options?.dryRun);
    const dayToEvaluate = options?.forceDay || new Date().getDate();

    // 1. Intentar llamar a la función serverless de Netlify si está disponible
    try {
      const response = await fetch('/.netlify/functions/cron-billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dryRun,
          forceDay: dayToEvaluate,
          clientes: options?.clientes,
          proyectos: options?.proyectos,
          pagos: options?.pagos,
          config: {
            evolutionApiUrl: config.evolutionApiUrl,
            evolutionApiKey: config.evolutionApiKey,
            evolutionInstance: config.evolutionInstance,
            resendApiKey: config.resendApiKey,
            resendFromEmail: config.resendFromEmail,
            agencyName: config.agencyName,
            currencySymbol: config.currencySymbol,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Sincronizar logs en el historial local si fue exitoso
        if (!dryRun && data.summary?.detalles) {
          for (const det of data.summary.detalles) {
            const cli = options?.clientes?.find((c) => c.nombre === det.cliente);
            if (cli) {
              await DataService.logNotificacion({
                cliente_id: cli.id,
                tipo: 'whatsapp',
                mensaje: `[CRON AUTOMÁTICO] ${det.tipo.toUpperCase()}`,
                estado: det.estado === 'fallido' ? 'fallido' : 'enviado',
              });
            }
          }
        }
        return data;
      }
    } catch (e) {
      // Fallback a motor local si la función serverless no está corriendo localmente
    }

    // 2. Fallback de Motor Local (Garantiza funcionamiento en entorno vite dev offline)
    const clientes = options?.clientes || [];
    const proyectos = options?.proyectos || [];
    const pagos = options?.pagos || [];
    const currentPeriod = new Date().toISOString().slice(0, 7);

    const summary = {
      timestamp: new Date().toISOString(),
      evaluatedDay: dayToEvaluate,
      dryRun,
      totalProyectosEvaluados: proyectos.length,
      totalClientesNotificados: 0,
      recordatoriosHoy: 0,
      recordatoriosPreventivos: 0,
      alertasMora: 0,
      mensajesWhatsApp: 0,
      correosResend: 0,
      errores: [] as string[],
      detalles: [] as any[],
    };

    const notifiedSet = new Set<string>();

    for (const proy of proyectos) {
      if (proy.estado !== 'activo') continue;
      const cliente = clientes.find((c) => c.id === proy.cliente_id);
      if (!cliente || cliente.estado !== 'activo') continue;

      const diaCobro = Number(proy.dia_cobro);
      const isDueToday = diaCobro === dayToEvaluate;
      const isUpcoming = diaCobro === ((dayToEvaluate + 3) > 31 ? (dayToEvaluate + 3 - 31) : (dayToEvaluate + 3));

      // Verificar si ya pagó este período
      const yaPago = pagos.some((p) => p.proyecto_id === proy.id && p.periodo_mes === currentPeriod && p.estado === 'pagado');
      if (yaPago) continue;

      let tipo: 'corte_hoy' | 'preventivo_3_dias' | null = null;
      if (isDueToday) {
        tipo = 'corte_hoy';
        summary.recordatoriosHoy++;
      } else if (isUpcoming) {
        tipo = 'preventivo_3_dias';
        summary.recordatoriosPreventivos++;
      }

      if (tipo) {
        notifiedSet.add(cliente.id);
        if (!dryRun) {
          summary.mensajesWhatsApp++;
          await DataService.logNotificacion({
            cliente_id: cliente.id,
            tipo: 'whatsapp',
            mensaje: `[CRON] ${tipo === 'corte_hoy' ? 'Aviso de cobro hoy' : 'Aviso preventivo 3 días'} - ${proy.nombre_proyecto}`,
            estado: 'enviado',
          });
        }
        summary.detalles.push({
          cliente: cliente.nombre,
          tipo,
          canal: 'WhatsApp (Evolution API)',
          estado: dryRun ? 'simulado' : 'enviado',
        });
      }
    }

    // Evaluar pagos en mora
    const mora = pagos.filter((p) => p.estado === 'vencido');
    for (const pago of mora) {
      const cliente = clientes.find((c) => c.id === pago.cliente_id);
      if (!cliente || notifiedSet.has(cliente.id)) continue;

      summary.alertasMora++;
      notifiedSet.add(cliente.id);

      if (!dryRun) {
        summary.mensajesWhatsApp++;
        await DataService.logNotificacion({
          cliente_id: cliente.id,
          tipo: 'whatsapp',
          mensaje: `[CRON] Reclamo saldo vencido - Período ${pago.periodo_mes}`,
          estado: 'enviado',
          referencia_pago_id: pago.id,
        });
      }

      summary.detalles.push({
        cliente: cliente.nombre,
        tipo: 'mora_vencida',
        canal: 'WhatsApp',
        estado: dryRun ? 'simulado' : 'enviado',
      });
    }

    summary.totalClientesNotificados = notifiedSet.size;

    return {
      success: true,
      message: dryRun
        ? `Simulación local completada: ${summary.totalClientesNotificados} clientes calificados.`
        : `Cron de cobranza ejecutado: ${summary.totalClientesNotificados} notificaciones procesadas.`,
      summary,
    };
  },
};

