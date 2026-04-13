import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generarPdfPedido(order) {
  const doc = new jsPDF();
  const azul    = [30, 64, 175];
  const gris    = [100, 100, 100];
  const negro   = [30, 30, 30];

  // ── Encabezado ────────────────────────────────────────────────────────
  doc.setFillColor(...azul);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('JRepuestos', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gestión de Pedidos', 14, 20);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(order.displayId, 196, 12, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${order.date}`, 196, 20, { align: 'right' });

  // ── Estado badge ──────────────────────────────────────────────────────
  const estadoColor = {
    Pendiente: [59,  130, 246],
    Completo:  [34,  197,  94],
    Cancelado: [156, 163, 175],
  }[order.status] ?? [156, 163, 175];

  doc.setFillColor(...estadoColor);
  doc.roundedRect(14, 33, 36, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(order.status.toUpperCase(), 32, 38.5, { align: 'center' });

  // ── Info cliente y entrega ────────────────────────────────────────────
  let y = 50;

  // Caja cliente
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y, 85, 42, 3, 3, 'F');

  doc.setTextColor(...azul);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL CLIENTE', 22, y + 8);

  doc.setTextColor(...negro);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente:`,   22, y + 16); doc.setFont('helvetica', 'bold');   doc.text(order.clientName,          60, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(`Teléfono:`,  22, y + 23); doc.setFont('helvetica', 'bold');   doc.text(order.contactPhone || '—', 60, y + 23);
  doc.setFont('helvetica', 'normal');
  doc.text(`Email:`,     22, y + 30); doc.setFont('helvetica', 'bold');   doc.text(order.contactEmail || '—', 60, y + 30);

  // Caja entrega
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(111, y, 85, 42, 3, 3, 'F');

  doc.setTextColor(...azul);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DIRECCIÓN DE ENTREGA', 119, y + 8);

  doc.setTextColor(...negro);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dirección:`, 119, y + 16); doc.setFont('helvetica', 'bold'); doc.text(order.deliveryAddress || '—', 148, y + 16);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ciudad:`,    119, y + 23); doc.setFont('helvetica', 'bold'); doc.text(order.deliveryCity    || '—', 148, y + 23);

  if (order.instrucciones_entrega) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(order.instrucciones_entrega, 70);
    doc.text('Instrucciones:', 119, y + 30);
    doc.setFont('helvetica', 'bold');
    doc.text(lines, 148, y + 30);
  }

  // ── Tabla de productos ────────────────────────────────────────────────
  y += 50;

  doc.setTextColor(...azul);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTOS DEL PEDIDO', 14, y);

  y += 4;

  const filas = (order.itemsData || []).map(d => [
    d.producto?.nombreProducto ?? `Producto #${d.productoId}`,
    d.producto?.referencia     ?? '—',
    d.cantidad,
    `$${Number(d.precio_unitario).toLocaleString('es-CO')}`,
    `$${(d.cantidad * d.precio_unitario).toLocaleString('es-CO')}`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Producto', 'Referencia', 'Cant.', 'P. Unitario', 'Subtotal']],
    body: filas.length > 0 ? filas : [['Sin productos registrados', '', '', '', '']],
    styles:     { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 35 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // ── Totales ───────────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 6;

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(120, finalY, 76, 28, 3, 3, 'F');

  const total     = Number(order.total);
  const sinIva    = Math.round(total / 1.19);
  const iva       = total - sinIva;

  doc.setTextColor(...gris);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:',   126, finalY + 8);
  doc.text('IVA (19%):',  126, finalY + 15);

  doc.setTextColor(...negro);
  doc.text(`$${sinIva.toLocaleString('es-CO')}`, 192, finalY + 8,  { align: 'right' });
  doc.text(`$${iva.toLocaleString('es-CO')}`,    192, finalY + 15, { align: 'right' });

  doc.setDrawColor(...azul);
  doc.setLineWidth(0.5);
  doc.line(126, finalY + 18, 192, finalY + 18);

  doc.setTextColor(...azul);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:',                              126, finalY + 25);
  doc.text(`$${total.toLocaleString('es-CO')}`,  192, finalY + 25, { align: 'right' });

  // ── Notas ─────────────────────────────────────────────────────────────
  if (order.notes) {
    const notaY = finalY + 35;
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.4);
    const lines = doc.splitTextToSize(order.notes, 155);
    doc.roundedRect(14, notaY, 100, 8 + lines.length * 5, 3, 3, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas:', 19, notaY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, 19, notaY + 11);
  }

  // ── Pie de página ─────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(...azul);
  doc.rect(0, pageH - 12, 210, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('JRepuestos — Documento generado automáticamente', 105, pageH - 5, { align: 'center' });

  // ── Descargar ─────────────────────────────────────────────────────────
  doc.save(`${order.displayId}.pdf`);
}