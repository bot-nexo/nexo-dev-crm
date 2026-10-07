import { SuscripcionStartup } from '../types/database';
import { getStoredConfig } from '../lib/supabase';
import { DataService } from './dataService';
import { formatCOP } from '../lib/formatters';

export interface SubscriptionDueInfo {
  daysRemaining: number;
  isOverdue: boolean;
  isToday: boolean;
  isSoon: boolean; // within 3 days
  statusLabel: string;
}

export function calculateSubscriptionDueInfo(sub: SuscripcionStartup): SubscriptionDueInfo {
  const targetDateStr = sub.estado === 'en_prueba' && sub.fecha_fin_prueba 
    ? sub.fecha_fin_prueba 
    : sub.proxima_fecha_pago;

  if (!targetDateStr) {
    return {
      daysRemaining: 999,
      isOverdue: false,
      isToday: false,
      isSoon: false,
      statusLabel: 'Sin fecha configurada',
    };
  }

  const parts = targetDateStr.split('T')[0].split('-');
  if (parts.length !== 3) {
    return {
      daysRemaining: 999,
      isOverdue: false,
      isToday: false,
      isSoon: false,
      statusLabel: 'Fecha inválida',
    };
  }

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  const targetDate = new Date(year, month - 1, day);
  targetDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = daysRemaining < 0;
  const isToday = daysRemaining === 0;
  const isSoon = daysRemaining > 0 && daysRemaining <= 3;

  let statusLabel = '';
  if (isOverdue) {
    statusLabel = `Venció hace ${Math.abs(daysRemaining)} días`;
  } else if (isToday) {
    statusLabel = `¡Vence y se cobra HOY!`;
  } else if (daysRemaining === 1) {
    statusLabel = `Se cobra MAÑANA`;
  } else {
    statusLabel = `Se cobra en ${daysRemaining} días`;
  }

  return {
    daysRemaining,
    isOverdue,
    isToday,
    isSoon,
    statusLabel,
  };
}

export function formatSubscriptionCost(amount: number, moneda: 'USD' | 'COP' | 'EUR' = 'USD'): string {
  if (moneda === 'COP') {
    return formatCOP(amount);
  }
  if (moneda === 'EUR') {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export const SubscriptionAlertService = {
  // 1. GENERATE MODERN HTML EMAIL NOTIFICATION
  generateAlertEmailHTML(
    sub: SuscripcionStartup,
    dueInfo: SubscriptionDueInfo
  ): { subject: string; html: string } {
    const config = getStoredConfig();
    const formattedCost = formatSubscriptionCost(sub.costo, sub.moneda);
    const agency = config.agencyName || 'Nexo Dev Studio';
    
    const isTrial = sub.estado === 'en_prueba';
    const urgencyBadge = dueInfo.isToday
      ? '🔴 COBRO INMINENTE HOY'
      : dueInfo.isOverdue
      ? '⚠️ PAGO VENCIDO'
      : `⏰ COBRO EN ${dueInfo.daysRemaining} DÍAS`;

    const subject = isTrial
      ? `🚨 [Alerta Fin de Prueba] Tu suscripción a ${sub.nombre_servicio} finaliza pronto (${formattedCost})`
      : `🔔 [Aviso de Cobro] Suscripción ${sub.nombre_servicio} por pagar - ${formattedCost} [${sub.email_cuenta}]`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #090d16;
            color: #f1f5f9;
            margin: 0;
            padding: 24px;
          }
          .card {
            max-width: 580px;
            margin: 0 auto;
            background: #0f172a;
            border-radius: 18px;
            border: 1px solid #1e293b;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          }
          .header {
            background: linear-gradient(135deg, #090d16 0%, #1e1b4b 100%);
            padding: 32px 28px;
            text-align: center;
            border-bottom: 1px solid #334155;
          }
          .logo {
            font-size: 20px;
            font-weight: 800;
            color: #00f2fe;
            letter-spacing: -0.5px;
          }
          .badge {
            display: inline-block;
            margin-top: 12px;
            padding: 6px 14px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            background: ${dueInfo.isToday || dueInfo.isOverdue ? '#ef4444' : '#0284c7'};
            color: #ffffff;
          }
          .content {
            padding: 28px;
          }
          .service-name {
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 6px 0;
          }
          .detail-box {
            background: #182234;
            border-radius: 12px;
            border: 1px solid #2d3e5a;
            padding: 18px;
            margin: 20px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #223147;
            font-size: 13px;
          }
          .row:last-child {
            border-bottom: none;
          }
          .label {
            color: #94a3b8;
            font-weight: 500;
          }
          .val {
            color: #f8fafc;
            font-weight: 700;
            text-align: right;
          }
          .highlight-cost {
            color: #38bdf8;
            font-size: 16px;
          }
          .email-highlight {
            color: #a78bfa;
            background: #2e1065;
            padding: 2px 8px;
            border-radius: 6px;
            font-family: monospace;
          }
          .btn-container {
            text-align: center;
            margin: 26px 0 10px 0;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
            color: #030712 !important;
            font-weight: 800;
            font-size: 14px;
            padding: 14px 28px;
            border-radius: 12px;
            text-decoration: none;
            box-shadow: 0 6px 20px rgba(0, 242, 254, 0.35);
          }
          .footer {
            padding: 20px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
            border-top: 1px solid #1e293b;
            background: #090d16;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">🚀 ${agency} - Control de Suscripciones</div>
            <div class="badge">${urgencyBadge}</div>
          </div>
          <div class="content">
            <h1 class="service-name">${sub.nombre_servicio}</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 0;">
              Hola, tienes un cobro programado para tu herramienta o infraestructura tecnológica:
            </p>

            <div class="detail-box">
              <div class="row">
                <span class="label">Monto / Tarifa:</span>
                <span class="val highlight-cost">${formattedCost} / ${sub.ciclo_cobro}</span>
              </div>
              <div class="row">
                <span class="label">Fecha de Cobro:</span>
                <span class="val" style="color: #f59e0b;">${sub.proxima_fecha_pago} (${dueInfo.statusLabel})</span>
              </div>
              <div class="row">
                <span class="label">Cuenta / Email registrado:</span>
                <span class="val email-highlight">${sub.email_cuenta}</span>
              </div>
              ${sub.metodo_pago ? `
              <div class="row">
                <span class="label">Método de Pago:</span>
                <span class="val">${sub.metodo_pago}</span>
              </div>` : ''}
              <div class="row">
                <span class="label">Categoría:</span>
                <span class="val" style="text-transform: capitalize;">${sub.categoria.replace('_', ' ')}</span>
              </div>
              <div class="row">
                <span class="label">Auto-renovación:</span>
                <span class="val">${sub.auto_renovacion ? '✅ Activada' : '⚠️ Manual'}</span>
              </div>
            </div>

            ${sub.notas ? `
            <div style="background: #0b1329; border-left: 3px solid #38bdf8; padding: 12px; border-radius: 6px; font-size: 12px; color: #cbd5e1; margin-bottom: 20px;">
              <strong>Notas / Credenciales:</strong> ${sub.notas}
            </div>` : ''}

            ${sub.url_panel_gestion ? `
            <div class="btn-container">
              <a href="${sub.url_panel_gestion}" target="_blank" class="btn">
                Ir al Panel de ${sub.nombre_servicio} →
              </a>
            </div>` : ''}
          </div>
          <div class="footer">
            Sistema de Alertas Automáticas de Suscripciones SaaS | ${agency}
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  },

  // 2. WHATSAPP ALERT TEXT
  generateWhatsAppAlert(sub: SuscripcionStartup, dueInfo: SubscriptionDueInfo): string {
    const config = getStoredConfig();
    const formattedCost = formatSubscriptionCost(sub.costo, sub.moneda);
    const isTrial = sub.estado === 'en_prueba';

    return (
      `🔔 *${config.agencyName}* - *Aviso de Pago de Suscripción*\n\n` +
      `Te recordamos el próximo cobro de la herramienta de tu startup:\n\n` +
      `🛠️ *Servicio:* ${sub.nombre_servicio}\n` +
      `💰 *Costo:* ${formattedCost} (${sub.ciclo_cobro})\n` +
      `📅 *Fecha de Cobro:* ${sub.proxima_fecha_pago} (${dueInfo.statusLabel})\n` +
      `📧 *Cuenta registrada:* ${sub.email_cuenta}\n` +
      (sub.metodo_pago ? `💳 *Método de Pago:* ${sub.metodo_pago}\n` : '') +
      (isTrial ? `⚠️ *Estado:* En período de prueba / Trial\n` : '') +
      (sub.url_panel_gestion ? `🔗 *Gestionar:* ${sub.url_panel_gestion}\n\n` : '\n') +
      `_Asegúrate de contar con fondos en la tarjeta o cancelar antes del cobro._`
    );
  },

  // 3. DISPATCH EMAIL VIA NETLIFY FUNCTION / RESEND
  async dispatchSubscriptionAlertEmail(
    sub: SuscripcionStartup,
    customEmail?: string
  ): Promise<{ success: boolean; message: string }> {
    const dueInfo = calculateSubscriptionDueInfo(sub);
    const { subject, html } = this.generateAlertEmailHTML(sub, dueInfo);
    const config = getStoredConfig();
    const recipient = customEmail || sub.email_notificacion_alerta || config.founderEmailAlerts || sub.email_cuenta;

    try {
      const response = await fetch('/.netlify/functions/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipient,
          clientName: 'Fundador / Admin',
          subject: subject,
          htmlContent: html,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update subscription last alert timestamp
        await DataService.saveSuscripcion({
          ...sub,
          ultima_alerta_enviada: new Date().toISOString(),
        });

        return {
          success: true,
          message: data.message || `¡Alerta de correo enviada exitosamente a ${recipient}!`,
        };
      }
    } catch (e: any) {
      console.warn('Fallback sending subscription email:', e);
    }

    // Local simulated fallback
    await DataService.saveSuscripcion({
      ...sub,
      ultima_alerta_enviada: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Alerta generada y registrada para ${recipient} (Modo vista previa/local).`,
    };
  },
};
