/**
 * Colombian Formatting Utilities for Nexo CRM
 * Provides standard formatting for Colombian Pesos (COP) and Colombian Date Formats.
 */

/**
 * Formats a numeric value into Colombian Pesos (COP).
 * Example: 1500000 -> "$ 1.500.000 COP" or "$ 1.500.000"
 */
export function formatCOP(amount: number | string | undefined | null, includeSuffix = true): string {
  const numericValue = Number(amount) || 0;
  
  // Format using standard es-CO locale with no fraction digits
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);

  return includeSuffix ? `${formatted} COP` : formatted;
}

/**
 * Formats date strings to Colombian standard formats.
 * - 'short': DD/MM/YYYY (e.g. "06/10/2026")
 * - 'medium': D de MMM. YYYY (e.g. "6 de oct. 2026")
 * - 'long': D de MMMM de YYYY (e.g. "6 de octubre de 2026")
 */
export function formatDateCO(
  dateStr?: string | null,
  formatType: 'short' | 'medium' | 'long' = 'short'
): string {
  if (!dateStr) return '';

  // Handle YYYY-MM period format
  if (dateStr.length === 7 && dateStr.includes('-')) {
    return formatPeriodCO(dateStr);
  }

  // Handle YYYY-MM-DD or ISO strings without timezone shift
  const cleanDateStr = dateStr.split('T')[0];
  const parts = cleanDateStr.split('-');

  if (parts.length === 3) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;

    if (formatType === 'short') {
      const dd = String(day).padStart(2, '0');
      const mm = String(month).padStart(2, '0');
      return `${dd}/${mm}/${year}`;
    }

    const dateObj = new Date(year, month - 1, day);
    if (formatType === 'medium') {
      return dateObj.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }

    return dateObj.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('es-CO');
  } catch {
    return dateStr;
  }
}

/**
 * Formats period YYYY-MM strings to Spanish Month Year format.
 * Example: "2026-10" -> "Octubre 2026"
 */
export function formatPeriodCO(periodStr?: string | null): string {
  if (!periodStr) return '';
  const parts = periodStr.split('-');
  if (parts.length === 2) {
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    if (!isNaN(year) && !isNaN(month) && month >= 1 && month <= 12) {
      const dateObj = new Date(year, month - 1, 1);
      const monthName = dateObj.toLocaleDateString('es-CO', { month: 'long' });
      return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    }
  }
  return periodStr;
}

export interface TrialInfo {
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  daysTotal: number;
  fechaFin: string;
  formattedStatus: string;
}

/**
 * Calculates trial status, days remaining, and expiration state for a project.
 */
export function getTrialInfo(proyecto: {
  estado?: string;
  dias_prueba?: number | null;
  fecha_fin_prueba?: string | null;
  fecha_inicio?: string;
}): TrialInfo {
  if (proyecto.estado !== 'en_prueba') {
    return {
      isTrial: false,
      isExpired: false,
      daysRemaining: 0,
      daysTotal: proyecto.dias_prueba || 0,
      fechaFin: proyecto.fecha_fin_prueba || '',
      formattedStatus: '',
    };
  }

  const daysTotal = proyecto.dias_prueba || 7;
  let fechaFinStr = proyecto.fecha_fin_prueba;

  if (!fechaFinStr && proyecto.fecha_inicio) {
    const parts = proyecto.fecha_inicio.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      const startDate = new Date(year, month - 1, day);
      startDate.setDate(startDate.getDate() + daysTotal);
      const y = startDate.getFullYear();
      const m = String(startDate.getMonth() + 1).padStart(2, '0');
      const d = String(startDate.getDate()).padStart(2, '0');
      fechaFinStr = `${y}-${m}-${d}`;
    }
  }

  if (!fechaFinStr) {
    fechaFinStr = new Date().toISOString().split('T')[0];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = fechaFinStr.split('-');
  const finYear = Number(parts[0]);
  const finMonth = Number(parts[1]);
  const finDay = Number(parts[2]);

  const finDate = new Date(finYear, finMonth - 1, finDay);
  finDate.setHours(0, 0, 0, 0);

  const diffTime = finDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining < 0;

  let formattedStatus = '';
  if (isExpired) {
    formattedStatus = `Prueba Vencida (hace ${Math.abs(daysRemaining)} días)`;
  } else if (daysRemaining === 0) {
    formattedStatus = `Prueba Vence Hoy`;
  } else {
    formattedStatus = `Prueba Activa (${daysRemaining} días restantes)`;
  }

  return {
    isTrial: true,
    isExpired,
    daysRemaining,
    daysTotal,
    fechaFin: fechaFinStr,
    formattedStatus,
  };
}
