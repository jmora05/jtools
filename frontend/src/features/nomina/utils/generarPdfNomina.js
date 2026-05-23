import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generarPdfNomina(record, formatCurrency) {
  const doc = new jsPDF();
  const azul  = [30, 64, 175];
  const rojo  = [185, 28, 28];
  const gris  = [100, 100, 100];
  const negro = [30, 30, 30];

  // ── Encabezado ────────────────────────────────────────────────────────
  doc.setFillColor(...azul);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('JRepuestos', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Desprendible de Nómina', 14, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Período: ${record.createdAt}`, 196, 12, { align: 'right' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 196, 20, { align: 'right' });

  // ── Info del empleado ─────────────────────────────────────────────────
  const y1 = 36;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y1, 182, 32, 3, 3, 'F');

  doc.setTextColor(...azul);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL EMPLEADO', 22, y1 + 8);

  doc.setTextColor(...negro);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Nombre:',    22, y1 + 16); doc.setFont('helvetica', 'bold'); doc.text(record.employeeName,     58, y1 + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Documento:', 22, y1 + 23); doc.setFont('helvetica', 'bold'); doc.text(record.employeeDocument, 58, y1 + 23);
  doc.setFont('helvetica', 'normal');
  doc.text('Cargo:',    115, y1 + 16); doc.setFont('helvetica', 'bold'); doc.text(record.position,         138, y1 + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Días trab.:', 115, y1 + 23); doc.setFont('helvetica', 'bold'); doc.text(String(record.daysWorked), 148, y1 + 23);

  // ── Devengos ──────────────────────────────────────────────────────────
  let y = y1 + 42;
  doc.setTextColor(...azul);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVENGOS', 14, y);
  y += 3;

  const cv = record.calculatedValues;
  const devengosRows = [
    ['Salario base proporcional', formatCurrency(cv.proportionalSalary)],
  ];
  if (cv.nightSurcharge   > 0) devengosRows.push(['Recargo nocturno (+35%)',  formatCurrency(cv.nightSurcharge)]);
  if (cv.extraDayPay      > 0) devengosRows.push(['Hora extra diurna (+25%)', formatCurrency(cv.extraDayPay)]);
  if (cv.sundayPay        > 0) devengosRows.push(['Hora dominical (+75%)',     formatCurrency(cv.sundayPay)]);
  if (cv.holidayPay       > 0) devengosRows.push(['Hora festiva (+75%)',       formatCurrency(cv.holidayPay)]);
  if (cv.transportAllowance > 0) devengosRows.push(['Auxilio de transporte',   formatCurrency(cv.transportAllowance)]);
  devengosRows.push(['TOTAL DEVENGADO', formatCurrency(cv.totalEarned)]);

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Valor']],
    body: devengosRows,
    styles:     { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 52, halign: 'right' } },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index === devengosRows.length - 1) {
        data.cell.styles.fontStyle  = 'bold';
        data.cell.styles.fillColor  = [219, 234, 254];
        data.cell.styles.textColor  = [30, 64, 175];
      }
    },
  });

  // ── Neto a pagar ──────────────────────────────────────────────────────
  const netY = doc.lastAutoTable.finalY + 10;
  doc.setFillColor(...azul);
  doc.roundedRect(14, netY, 182, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('NETO A PAGAR:', 22, netY + 14);
  doc.setFontSize(14);
  doc.text(formatCurrency(cv.netPay), 192, netY + 14, { align: 'right' });

  // ── Pie de página ─────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(...azul);
  doc.rect(0, pageH - 12, 210, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('JRepuestos — Documento generado automáticamente', 105, pageH - 5, { align: 'center' });

  const safeName = record.employeeName.replace(/\s+/g, '_');
  doc.save(`nomina_${safeName}_${record.createdAt}.pdf`);
}
