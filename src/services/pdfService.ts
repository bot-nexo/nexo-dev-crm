import { jsPDF } from 'jspdf';
import { Pago, Cliente, Proyecto } from '../types/database';
import { getStoredConfig } from '../lib/supabase';

export interface GeneratePdfOptions {
  pago: Pago;
  cliente?: Cliente;
  proyecto?: Proyecto;
}

export const PdfService = {
  /**
   * Genera una instancia jsPDF configurada con el comprobante oficial
   */
  createReceiptPdfDoc({ pago, cliente, proyecto }: GeneratePdfOptions): jsPDF {
    const config = getStoredConfig();
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    const receiptNumber = `NX-${pago.periodo_mes?.replace('-', '') || '202610'}-${pago.id.slice(0, 4).toUpperCase()}`;
    const agencyName = config.agencyName || 'NEXO DEV STUDIO';
    const currency = config.currencySymbol || '$';
    const formattedAmount = `${currency}${Number(pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD`;

    // 1. BANNER SUPERIOR CON ESTILO TECH / FINTECH
    doc.setFillColor(9, 13, 22); // #090d16
    doc.rect(0, 0, pageWidth, 42, 'F');

    // Acento cian eléctrico
    doc.setFillColor(0, 242, 254); // #00f2fe
    doc.rect(0, 41, pageWidth, 1.5, 'F');

    // Logo / Nombre de Agencia
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(agencyName.toUpperCase(), margin, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('Soluciones de Software, Cloud & Aplicaciones Web Pro', margin, 27);
    doc.text('billing@nexodevstudio.com  •  www.nexodevstudio.com', margin, 33);

    // Número de Comprobante y Estado en Cabecera
    doc.setTextColor(0, 242, 254);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(`COMPROBANTE #${receiptNumber}`, pageWidth - margin, 20, { align: 'right' });

    // Badge de Estado (Verde para pagado, Ámbar para pendiente, Rojo para vencido)
    const estado = (pago.estado || 'pagado').toLowerCase();
    if (estado === 'pagado') {
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.setTextColor(255, 255, 255);
    } else if (estado === 'pendiente') {
      doc.setFillColor(245, 158, 11); // Amber 500
      doc.setTextColor(0, 0, 0);
    } else {
      doc.setFillColor(239, 68, 68); // Rose 500
      doc.setTextColor(255, 255, 255);
    }

    doc.roundedRect(pageWidth - margin - 32, 26, 32, 7, 1.5, 1.5, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(estado.toUpperCase(), pageWidth - margin - 16, 30.5, { align: 'center' });

    // 2. METADATOS DE EMISIÓN
    let currentY = 54;
    doc.setTextColor(71, 85, 105); // Slate 600
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    doc.text(`Fecha de Emisión:`, margin, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.text(pago.fecha_pago || new Date().toISOString().slice(0, 10), margin + 32, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Período Facturado:`, pageWidth - margin - 50, currentY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(pago.periodo_mes || 'N/A', pageWidth - margin, currentY, { align: 'right' });

    // 3. TARJETAS DE INFORMACIÓN (CLIENTE Y PROYECTO)
    currentY += 10;
    const cardHeight = 38;
    const cardWidth = (contentWidth - 6) / 2;

    // Tarjeta Cliente
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('FACTURADO A (CLIENTE):', margin + 6, currentY + 8);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(cliente?.nombre || 'Cliente General', margin + 6, currentY + 16);

    doc.setFontSize(9);
    doc.setTextColor(2, 132, 199); // Sky 600
    doc.text(cliente?.empresa || 'Empresa Cliente', margin + 6, currentY + 22);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.text(`Email: ${cliente?.email || 'N/A'}`, margin + 6, currentY + 28);
    doc.text(`Tel / WhatsApp: ${cliente?.telefono || 'N/A'}`, margin + 6, currentY + 33);

    // Tarjeta Proyecto
    const projectCardX = margin + cardWidth + 6;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(projectCardX, currentY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SERVICIO / PROYECTO:', projectCardX + 6, currentY + 8);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(proyecto?.nombre_proyecto || 'Desarrollo de Software Web Pro', projectCardX + 6, currentY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8.5);
    doc.text(`Día de Corte Mensual: Día ${proyecto?.dia_cobro || 1} de cada mes`, projectCardX + 6, currentY + 23);
    doc.text(`Estado del Contrato: ${(proyecto?.estado || 'activo').toUpperCase()}`, projectCardX + 6, currentY + 28);
    doc.text(`ID Proyecto: ${proyecto?.id?.slice(0, 8) || 'N/A'}...`, projectCardX + 6, currentY + 33);

    // 4. TABLA DE CONCEPTOS
    currentY += cardHeight + 12;

    // Cabecera de Tabla
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.roundedRect(margin, currentY, contentWidth, 9, 1.5, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('DESCRIPCIÓN DEL SERVICIO', margin + 6, currentY + 6);
    doc.text('PERÍODO', margin + 105, currentY + 6, { align: 'center' });
    doc.text('SUBTOTAL (USD)', pageWidth - margin - 6, currentY + 6, { align: 'right' });

    // Fila 1 de Ítem
    currentY += 9;
    const rowHeight = 22;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, contentWidth, rowHeight, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Desarrollo, Mantenimiento & Infraestructura Cloud', margin + 6, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(
      `${proyecto?.nombre_proyecto || 'Contrato Recurrente'} — Cuota mensual acordada bajo contrato de desarrollo.`,
      margin + 6,
      currentY + 14
    );

    // Período
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(pago.periodo_mes || 'Vigente', margin + 105, currentY + 11, { align: 'center' });

    // Subtotal
    doc.setFontSize(10);
    doc.text(formattedAmount, pageWidth - margin - 6, currentY + 11, { align: 'right' });

    // 5. CAJA DE TOTAL Y NOTAS
    currentY += rowHeight + 10;

    // Caja de Notas (Izquierda)
    const notesWidth = contentWidth * 0.58;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, notesWidth, 32, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('NOTAS Y OBSERVACIONES:', margin + 6, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8.5);
    const notasText = pago.notas || 'Pago registrado y conciliado exitosamente mediante transferencia bancaria digital.';
    const splitNotas = doc.splitTextToSize(notasText, notesWidth - 12);
    doc.text(splitNotas, margin + 6, currentY + 15);

    // Caja de Total (Derecha)
    const totalBoxX = margin + notesWidth + 6;
    const totalBoxWidth = contentWidth - notesWidth - 6;

    doc.setFillColor(9, 13, 22); // Dark container
    doc.roundedRect(totalBoxX, currentY, totalBoxWidth, 32, 2, 2, 'F');

    // Acento cian
    doc.setFillColor(0, 242, 254);
    doc.rect(totalBoxX, currentY, totalBoxWidth, 1.2, 'F');

    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL ABONADO', totalBoxX + totalBoxWidth / 2, currentY + 10, { align: 'center' });

    doc.setTextColor(0, 242, 254);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(formattedAmount, totalBoxX + totalBoxWidth / 2, currentY + 21, { align: 'center' });

    // 6. CERTIFICACIÓN Y PIE DE PÁGINA
    const footerY = pageHeight - 32;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY, pageWidth - margin, footerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.text(`ID de Transacción: ${pago.id}`, margin, footerY + 6);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, margin, footerY + 11);
    doc.text(
      'Documento digital expedido por Nexo Dev Studio CRM. Válido como comprobante oficial de pago para conciliación contable.',
      margin,
      footerY + 16
    );

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text('✓ Transacción Verificada & Certificada', pageWidth - margin, footerY + 11, { align: 'right' });

    return doc;
  },

  /**
   * Descarga directamente el archivo PDF en el navegador del usuario
   */
  downloadReceiptPdf(options: GeneratePdfOptions): void {
    const doc = this.createReceiptPdfDoc(options);
    const receiptNumber = `NX-${options.pago.periodo_mes?.replace('-', '') || '202610'}-${options.pago.id.slice(0, 4).toUpperCase()}`;
    const clientSlug = (options.cliente?.empresa || options.cliente?.nombre || 'cliente')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-');
    const filename = `Comprobante_${receiptNumber}_${clientSlug}.pdf`;
    doc.save(filename);
  },

  /**
   * Obtiene el PDF como Blob para adjuntar o subir a almacenamiento
   */
  getReceiptPdfBlob(options: GeneratePdfOptions): Blob {
    const doc = this.createReceiptPdfDoc(options);
    return doc.output('blob');
  },

  /**
   * Obtiene la URL de objeto para previsualización inmediata en iframe o nueva pestaña
   */
  getReceiptPdfDataUrl(options: GeneratePdfOptions): string {
    const doc = this.createReceiptPdfDoc(options);
    return doc.output('datauristring');
  },
};
