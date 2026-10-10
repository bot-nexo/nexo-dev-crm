/**
 * Netlify Serverless Function: Cron de Cobranza Programada
 * Endpoint: /.netlify/functions/cron-billing
 * 
 * Modos de ejecución:
 * 1. Scheduled Function (Netlify cron automático diario a las 09:00 AM UTC-5).
 * 2. HTTP POST/GET (Trigger manual desde UI o webhook externo con o sin token CRON_SECRET).
 * 3. Híbrido: Conexión directa a Supabase o procesamiento de payload enviado desde frontend.
 */

interface CronRequestPayload {
  dryRun?: boolean; // Si es true, simula la evaluación sin enviar WhatsApps/Emails
  forceDay?: number; // Permite forzar un día específico de prueba (1-31)
  cronSecret?: string;
  // Soporte híbrido (datos enviados por frontend si no hay conexión directa del servidor a Supabase)
  clientes?: any[];
  proyectos?: any[];
  pagos?: any[];
  config?: {
    evolutionApiUrl?: string;
    evolutionApiKey?: string;
    evolutionInstance?: string;
    resendApiKey?: string;
    resendFromEmail?: string;
    agencyName?: string;
    currencySymbol?: string;
  };
}

interface CronExecutionSummary {
  timestamp: string;
  evaluatedDay: number;
  periodo: string;
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
}

export const handler = async (event: { httpMethod: string; headers: Record<string, string | undefined>; body: string | null }) => {
  // Manejo de CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-cron-secret',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const now = new Date();
    const currentDay = now.getDate();
    const currentPeriod = now.toISOString().slice(0, 7); // YYYY-MM

    // Leer payload si es POST
    let payload: CronRequestPayload = {};
    if (event.body) {
      try {
        payload = JSON.parse(event.body);
      } catch (e) {
        // Body no es JSON válido, continúa con defaults
      }
    }

    const dryRun = Boolean(payload.dryRun);
    const dayToEvaluate = payload.forceDay && payload.forceDay >= 1 && payload.forceDay <= 31
      ? payload.forceDay
      : currentDay;

    // Validación opcional de secreto si está configurado en variables de entorno
    const configuredSecret = process.env.CRON_SECRET;
    const providedSecret = payload.cronSecret || event.headers['x-cron-secret'] || event.headers['authorization']?.replace('Bearer ', '');
    if (configuredSecret && configuredSecret !== providedSecret) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Acceso no autorizado: Token secreto del Cron inválido.' }),
      };
    }

    // Configuración de credenciales de envío
    const evolutionUrl = payload.config?.evolutionApiUrl || process.env.EVOLUTION_API_URL || process.env.VITE_EVOLUTION_API_URL;
    const evolutionKey = payload.config?.evolutionApiKey || process.env.EVOLUTION_API_KEY || process.env.VITE_EVOLUTION_API_KEY;
    const evolutionInstance = payload.config?.evolutionInstance || process.env.EVOLUTION_INSTANCE_NAME || 'nexo-crm';

    const resendKey = payload.config?.resendApiKey || process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    const resendFrom = payload.config?.resendFromEmail || process.env.RESEND_FROM_EMAIL || 'Nexo Dev Studio <billing@nexodevstudio.com>';
    const agencyName = payload.config?.agencyName || 'Nexo Dev Studio';
    const currency = payload.config?.currencySymbol || '$';

    // Obtener datos (desde payload híbrido o desde Supabase)
    let clientes = payload.clientes || [];
    let proyectos = payload.proyectos || [];
    let pagos = payload.pagos || [];

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if ((!clientes.length || !proyectos.length) && supabaseUrl && supabaseKey) {
      // Consulta directa a Supabase si no se proveyeron datos por el cliente
      const headers = {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      };

      const [resCli, resProy, resPag] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/clientes?select=*&estado=eq.activo`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/proyectos?select=*&estado=eq.activo`, { headers }),
        fetch(`${supabaseUrl}/rest/v1/pagos?select=*`, { headers }),
      ]);

      if (resCli.ok) clientes = await resCli.json();
      if (resProy.ok) proyectos = await resProy.json();
      if (resPag.ok) pagos = await resPag.json();
    }

    const summary: CronExecutionSummary = {
      timestamp: now.toISOString(),
      evaluatedDay: dayToEvaluate,
      periodo: currentPeriod,
      dryRun,
      totalProyectosEvaluados: proyectos.length,
      totalClientesNotificados: 0,
      recordatoriosHoy: 0,
      recordatoriosPreventivos: 0,
      alertasMora: 0,
      mensajesWhatsApp: 0,
      correosResend: 0,
      errores: [],
      detalles: [],
    };

    const notifiedClientsSet = new Set<string>();

    // 1. EVALUAR PROYECTOS ACTIVOS
    for (const proy of proyectos) {
      const cliente = clientes.find((c: any) => c.id === proy.cliente_id);
      if (!cliente || cliente.estado !== 'activo') continue;

      const diaCobro = Number(proy.dia_cobro);
      const isDueToday = diaCobro === dayToEvaluate;
      const isUpcomingPreventive = diaCobro === ((dayToEvaluate + 3) > 31 ? (dayToEvaluate + 3 - 31) : (dayToEvaluate + 3));

      // Verificar si ya tiene un pago registrado para este período
      const pagoExistente = pagos.find(
        (p: any) => p.proyecto_id === proy.id && p.periodo_mes === currentPeriod
      );
      const yaEstaPagado = pagoExistente && pagoExistente.estado === 'pagado';

      if (yaEstaPagado) continue; // Si ya pagó el período actual, no notificar

      let templateType: 'corte_hoy' | 'preventivo_3_dias' | null = null;
      if (isDueToday) {
        templateType = 'corte_hoy';
        summary.recordatoriosHoy++;
      } else if (isUpcomingPreventive) {
        templateType = 'preventivo_3_dias';
        summary.recordatoriosPreventivos++;
      }

      if (templateType) {
        const montoStr = `${currency}${Number(proy.valor_mensual).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;
        const nombreCliente = cliente.nombre.split(' ')[0];

        // Mensaje WhatsApp
        let waMessage = '';
        if (templateType === 'corte_hoy') {
          waMessage =
            `📅 *${agencyName}* - *Aviso de Cobro Mensual Hoy*\n\n` +
            `Hola ${nombreCliente}, buen día.\n\n` +
            `Te recordamos que hoy *día ${diaCobro}* corresponde la renovación mensual del servicio de desarrollo:\n\n` +
            `📌 *Proyecto:* ${proy.nombre_proyecto}\n` +
            `💵 *Monto:* ${montoStr} USD\n` +
            `📅 *Período:* ${currentPeriod}\n\n` +
            `Agradecemos coordinar la transferencia bancaria durante la jornada.\n\n` +
            `_Equipo de Administración de ${agencyName}_`;
        } else {
          waMessage =
            `🔔 *${agencyName}* - *Aviso Preventivo de Cobro*\n\n` +
            `Hola ${nombreCliente}, te saludamos de ${agencyName}.\n\n` +
            `Queremos recordarte que en 3 días (el *día ${diaCobro}*) se cumplirá el corte mensual de tu proyecto:\n\n` +
            `📌 *Proyecto:* ${proy.nombre_proyecto}\n` +
            `💵 *Valor Mensual:* ${montoStr} USD\n\n` +
            `Quedamos a tu disposición si precisas factura comercial previa o soporte.\n\n` +
            `¡Que tengas un excelente día!`;
        }

        // Ejecutar envíos si no es simulación
        if (!dryRun) {
          // WhatsApp vía Evolution API
          if (evolutionUrl && evolutionKey && cliente.telefono) {
            const cleanPhone = cliente.telefono.replace(/[^0-9]/g, '');
            try {
              const res = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
                method: 'POST',
                headers: {
                  'apikey': evolutionKey,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ number: cleanPhone, text: waMessage }),
              });
              if (res.ok) {
                summary.mensajesWhatsApp++;
              } else {
                const errTxt = await res.text();
                summary.errores.push(`Error Evolution WhatsApp (${cliente.nombre}): ${errTxt}`);
              }
            } catch (err: any) {
              summary.errores.push(`Excepción WhatsApp (${cliente.nombre}): ${err.message}`);
            }
          }

          // Email vía Resend si aplica
          if (resendKey && cliente.email) {
            try {
              const emailSubject = templateType === 'corte_hoy'
                ? `📅 Recordatorio de Cobro: ${proy.nombre_proyecto} - ${agencyName}`
                : `🔔 Aviso Preventivo de Facturación: ${proy.nombre_proyecto} - ${agencyName}`;

              const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${resendKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: resendFrom,
                  to: [cliente.email],
                  subject: emailSubject,
                  html: `
                    <div style="font-family: sans-serif; background: #090d16; color: #f1f5f9; padding: 24px; border-radius: 12px;">
                      <h2 style="color: #00f2fe;">${agencyName}</h2>
                      <p>Hola <strong>${cliente.nombre}</strong>,</p>
                      <p>${templateType === 'corte_hoy' ? 'Hoy es tu fecha de corte mensual.' : 'Tu fecha de corte es en 3 días.'}</p>
                      <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
                        <p style="margin: 4px 0;"><strong>Proyecto:</strong> ${proy.nombre_proyecto}</p>
                        <p style="margin: 4px 0;"><strong>Monto:</strong> ${montoStr} USD</p>
                        <p style="margin: 4px 0;"><strong>Día de corte:</strong> Día ${diaCobro} de cada mes</p>
                      </div>
                      <p style="color: #94a3b8; font-size: 12px;">Mensaje automático despachado por el servicio de facturación.</p>
                    </div>
                  `,
                }),
              });
              if (res.ok) summary.correosResend++;
            } catch (err: any) {
              summary.errores.push(`Excepción Resend (${cliente.nombre}): ${err.message}`);
            }
          }
        }

        notifiedClientsSet.add(cliente.id);
        summary.detalles.push({
          cliente: cliente.nombre,
          tipo: templateType,
          canal: 'WhatsApp + Email',
          estado: dryRun ? 'simulado' : 'enviado',
        });
      }
    }

    // 2. EVALUAR PAGOS EN MORA / VENCIDOS
    const pagosVencidos = pagos.filter((p: any) => p.estado === 'vencido');
    for (const pago of pagosVencidos) {
      const cliente = clientes.find((c: any) => c.id === pago.cliente_id);
      if (!cliente || notifiedClientsSet.has(cliente.id)) continue; // Evitar doble notificación al mismo cliente en la misma corrida

      summary.alertasMora++;
      const montoStr = `${currency}${Number(pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`;

      const waMoraMessage =
        `⚠️ *${agencyName}* - *Notificación de Saldo Vencido*\n\n` +
        `Estimado/a ${cliente.nombre},\n\n` +
        `Nos comunicamos para informarle que registramos un saldo pendiente en su cuenta:\n\n` +
        `💰 *Monto Adeudado:* ${montoStr} USD\n` +
        `📅 *Período en Mora:* ${pago.periodo_mes}\n` +
        `⚠️ *Estado:* Vencido\n\n` +
        `Le solicitamos regularizar el pago a la brevedad para garantizar la continuidad del soporte y los despliegues de desarrollo.\n\n` +
        `Si ya realizó el abono, por favor comparta el comprobante por este medio.\n\n` +
        `_Departamento de Cobranzas - ${agencyName}_`;

      if (!dryRun && evolutionUrl && evolutionKey && cliente.telefono) {
        const cleanPhone = cliente.telefono.replace(/[^0-9]/g, '');
        try {
          const res = await fetch(`${evolutionUrl}/message/sendText/${evolutionInstance}`, {
            method: 'POST',
            headers: {
              'apikey': evolutionKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ number: cleanPhone, text: waMoraMessage }),
          });
          if (res.ok) summary.mensajesWhatsApp++;
        } catch (err: any) {
          summary.errores.push(`Excepción Mora WhatsApp (${cliente.nombre}): ${err.message}`);
        }
      }

      notifiedClientsSet.add(cliente.id);
      summary.detalles.push({
        cliente: cliente.nombre,
        tipo: 'mora_vencida',
        canal: 'WhatsApp',
        estado: dryRun ? 'simulado' : 'enviado',
      });
    }

    summary.totalClientesNotificados = notifiedClientsSet.size;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: dryRun
          ? `Simulación de cron completada: ${summary.totalClientesNotificados} clientes calificados.`
          : `Cron de cobranza ejecutado: ${summary.totalClientesNotificados} avisos despachados.`,
        summary,
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Error interno al procesar el cron de cobranza.',
      }),
    };
  }
};
