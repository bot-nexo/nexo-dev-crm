import { Cliente, Proyecto, Pago, Notificacion, AppConfig } from '../types/database';
import { getStoredConfig } from '../lib/supabase';

export interface BackupData {
  version: string;
  timestamp: string;
  agencyName: string;
  clientes: Cliente[];
  proyectos: Proyecto[];
  pagos: Pago[];
  notificaciones: Notificacion[];
  config?: Partial<AppConfig>;
}

export const ExportService = {
  /**
   * Helper para sanitizar y escapar campos CSV evitando CSV Injection y errores de delimitadores
   */
  escapeCSV(val: any): string {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  },

  /**
   * Helper para descargar un Blob como archivo en el navegador
   */
  downloadBlob(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * 1. EXPORTAR TABLA DE PAGOS Y COBRANZAS A CSV (COMPATIBLE CON EXCEL)
   */
  exportPagosToCSV(pagos: Pago[], filenameSuffix: string = ''): void {
    const headers = [
      'ID Pago',
      'Fecha Pago',
      'Período (YYYY-MM)',
      'Cliente',
      'Empresa',
      'Email Cliente',
      'Teléfono WhatsApp',
      'Proyecto / Servicio',
      'Monto (USD)',
      'Estado',
      'Comprobante URL',
      'Notas y Observaciones',
    ];

    const rows = pagos.map((p) => [
      this.escapeCSV(p.id),
      this.escapeCSV(p.fecha_pago),
      this.escapeCSV(p.periodo_mes),
      this.escapeCSV(p.cliente?.nombre || ''),
      this.escapeCSV(p.cliente?.empresa || ''),
      this.escapeCSV(p.cliente?.email || ''),
      this.escapeCSV(p.cliente?.telefono || ''),
      this.escapeCSV(p.proyecto?.nombre_proyecto || ''),
      Number(p.monto || 0).toFixed(2),
      this.escapeCSV(p.estado.toUpperCase()),
      this.escapeCSV(p.comprobante_url || ''),
      this.escapeCSV(p.notas || ''),
    ]);

    // Incluir BOM UTF-8 (\uFEFF) para visualización perfecta de tildes en Excel
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `NexoCRM_Pagos_${dateStr}${filenameSuffix ? '_' + filenameSuffix : ''}.csv`;

    this.downloadBlob(csvContent, filename);
  },

  /**
   * 2. EXPORTAR CARTERA DE CLIENTES Y MRR A CSV
   */
  exportClientesToCSV(clientes: Cliente[], proyectos: Proyecto[], pagos: Pago[]): void {
    const headers = [
      'ID Cliente',
      'Nombre de Contacto',
      'Empresa',
      'Email',
      'Teléfono WhatsApp',
      'Estado Cliente',
      'Proyectos Activos',
      'MRR Mensual Total (USD)',
      'Total Pagos Realizados (USD)',
      'Deuda Vencida (USD)',
      'Fecha Registro',
    ];

    const rows = clientes.map((c) => {
      const cliProyectos = proyectos.filter((p) => p.cliente_id === c.id);
      const cliPagos = pagos.filter((p) => p.cliente_id === c.id);

      const proyectosActivos = cliProyectos.filter((p) => p.estado === 'activo').length;
      const mrrTotal = cliProyectos
        .filter((p) => p.estado === 'activo')
        .reduce((sum, p) => sum + (Number(p.valor_mensual) || 0), 0);

      const totalCobrado = cliPagos
        .filter((p) => p.estado === 'pagado')
        .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

      const totalVencido = cliPagos
        .filter((p) => p.estado === 'vencido')
        .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

      return [
        this.escapeCSV(c.id),
        this.escapeCSV(c.nombre),
        this.escapeCSV(c.empresa),
        this.escapeCSV(c.email),
        this.escapeCSV(c.telefono),
        this.escapeCSV(c.estado.toUpperCase()),
        proyectosActivos,
        mrrTotal.toFixed(2),
        totalCobrado.toFixed(2),
        totalVencido.toFixed(2),
        this.escapeCSV(c.fecha_registro?.slice(0, 10) || ''),
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `NexoCRM_Clientes_CarteraMRR_${dateStr}.csv`;

    this.downloadBlob(csvContent, filename);
  },

  /**
   * 3. EXPORTAR CONCILIACIÓN FINANCIERA MENSUAL A CSV
   */
  exportConciliacionToCSV(pagos: Pago[], proyectos: Proyecto[]): void {
    // Agrupar por mes
    const periodosMap = new Map<
      string,
      {
        cobrado: number;
        pendiente: number;
        vencido: number;
        conteoCobrado: number;
        conteoTotal: number;
      }
    >();

    // Inicializar mapa con períodos presentes en pagos
    pagos.forEach((p) => {
      const per = p.periodo_mes || 'Desconocido';
      if (!periodosMap.has(per)) {
        periodosMap.set(per, {
          cobrado: 0,
          pendiente: 0,
          vencido: 0,
          conteoCobrado: 0,
          conteoTotal: 0,
        });
      }
      const data = periodosMap.get(per)!;
      const monto = Number(p.monto) || 0;
      data.conteoTotal++;

      if (p.estado === 'pagado') {
        data.cobrado += monto;
        data.conteoCobrado++;
      } else if (p.estado === 'pendiente') {
        data.pendiente += monto;
      } else if (p.estado === 'vencido') {
        data.vencido += monto;
      }
    });

    const headers = [
      'Período (Mes)',
      'Total Cobrado (USD)',
      'Total Pendiente (USD)',
      'Total Vencido / Mora (USD)',
      'Total Facturado Mes (USD)',
      '% Tasa de Recaudación',
      'Cant. Pagos Cobrados',
      'Cant. Total Pagos',
    ];

    const sortedPeriods = Array.from(periodosMap.keys()).sort().reverse();
    const rows = sortedPeriods.map((per) => {
      const d = periodosMap.get(per)!;
      const totalMes = d.cobrado + d.pendiente + d.vencido;
      const rate = totalMes > 0 ? ((d.cobrado / totalMes) * 100).toFixed(1) + '%' : '100%';

      return [
        this.escapeCSV(per),
        d.cobrado.toFixed(2),
        d.pendiente.toFixed(2),
        d.vencido.toFixed(2),
        totalMes.toFixed(2),
        this.escapeCSV(rate),
        d.conteoCobrado,
        d.conteoTotal,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `NexoCRM_Conciliacion_Mensual_${dateStr}.csv`;

    this.downloadBlob(csvContent, filename);
  },

  /**
   * 4. GENERAR RESPALDO COMPLETO DEL CRM EN FORMATO JSON
   */
  exportBackupJSON(
    clientes: Cliente[],
    proyectos: Proyecto[],
    pagos: Pago[],
    notificaciones: Notificacion[]
  ): void {
    const config = getStoredConfig();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 5).replace(':', '');

    const backupData: BackupData = {
      version: '1.0.0',
      timestamp: now.toISOString(),
      agencyName: config.agencyName || 'Nexo Dev Studio',
      clientes,
      proyectos,
      pagos,
      notificaciones,
      config: {
        agencyName: config.agencyName,
        currencySymbol: config.currencySymbol,
        resendFromEmail: config.resendFromEmail,
      },
    };

    const jsonContent = JSON.stringify(backupData, null, 2);
    const filename = `NexoCRM_Backup_${dateStr}_${timeStr}.json`;

    this.downloadBlob(jsonContent, filename, 'application/json');
  },
};
