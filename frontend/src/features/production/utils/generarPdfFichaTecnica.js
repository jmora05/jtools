import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Genera y descarga la Ficha Técnica de un producto en formato PDF.
 * El documento sigue la estructura estándar del proyecto:
 * encabezado empresa → datos de la ficha → tablas de parámetros de máquina → insumos → pie.
 *
 * @param {FichaTecnica} ficha - Registro de ficha técnica con producto, parámetros de máquina e insumos.
 */
export function generarPdfFichaTecnica(ficha) {
  const doc = new jsPDF();
  // Paleta corporativa: azul institucional, gris para textos secundarios, negro para cuerpo.
  const azul  = [30, 64, 175];
  const gris  = [100, 100, 100];
  const negro = [30, 30, 30];

  // ── Encabezado ────────────────────────────────────────────────────────
  // Banda azul superior: identifica visualmente el documento como oficial de JRepuestos.
  doc.setFillColor(...azul);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('JRepuestos', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Ficha Técnica', 14, 20);

  // El código de ficha se alinea a la derecha como referencia del documento.
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(ficha.codigoFicha ?? '—', 196, 12, { align: 'right' });

  // Fecha de generación para trazabilidad; permite saber si la ficha es reciente o archivada.
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 196, 20, { align: 'right' });

  // ── Info de la ficha ──────────────────────────────────────────────────
  // Bloque gris claro: resalta los datos de identificación sin sobrecargar visualmente.
  const y1 = 36;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y1, 182, 32, 3, 3, 'F');

  doc.setTextColor(...azul);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DE LA FICHA', 22, y1 + 8);

  doc.setTextColor(...negro);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Producto:',   22, y1 + 16); doc.setFont('helvetica', 'bold'); doc.text(ficha.producto?.nombreProducto ?? '—', 58, y1 + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Referencia:', 22, y1 + 23); doc.setFont('helvetica', 'bold'); doc.text(ficha.producto?.referencia ?? '—', 58, y1 + 23);
  doc.setFont('helvetica', 'normal');
  doc.text('Estado:',    115, y1 + 16); doc.setFont('helvetica', 'bold'); doc.text(ficha.estado ?? '—',              140, y1 + 16);
  doc.setFont('helvetica', 'normal');
  doc.text('Molde:',     115, y1 + 23); doc.setFont('helvetica', 'bold'); doc.text(ficha.numeroMolde ?? '—',         140, y1 + 23);

  // ── Parámetros de máquina ─────────────────────────────────────────────
  const pm = ficha.parametrosMaquina ?? {};
  const ui = pm.unidadInyeccion ?? {};
  const pr = pm.prensa ?? {};
  const tm = pm.temperaturas ?? {};
  const ti = pm.tiempos ?? {};
  const v  = (n) => (n != null ? String(n) : '0');

  let y = y1 + 42;

  // Unidad de Inyección
  doc.setTextColor(...azul);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('UNIDAD DE INYECCIÓN', 14, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [['Movimiento', 'Velocidad', 'Presión', 'Contrapresión']],
    body: [
      ['Tolva',         v(ui.tolva?.velocidad),            v(ui.tolva?.presion),            '—'],
      ['Inyección',     v(ui.inyeccion?.velocidad),        v(ui.inyeccion?.presion),        '—'],
      ['2a Inyección',  v(ui.segundaInyeccion?.velocidad), v(ui.segundaInyeccion?.presion), '—'],
      ['Carga',         v(ui.carga?.velocidad),            v(ui.carga?.presion),            v(ui.carga?.contrapresion)],
      ['Descompresión', v(ui.decompresion?.velocidad),     v(ui.decompresion?.presion),     '—'],
    ],
    styles:     { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 37, halign: 'center' },
      2: { cellWidth: 37, halign: 'center' },
      3: { cellWidth: 38, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // Prensa
  let yP = doc.lastAutoTable.finalY + 8;
  doc.setTextColor(...azul);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PRENSA', 14, yP);
  yP += 3;

  autoTable(doc, {
    startY: yP,
    head: [['Movimiento', 'Velocidad', 'Presión', 'Nro. Salidas']],
    body: [
      ['Abrir',           v(pr.abrir?.velocidad),       v(pr.abrir?.presion),       '—'],
      ['Cerrar',          v(pr.cerrar?.velocidad),      v(pr.cerrar?.presion),      '—'],
      ['Seguro de Molde', v(pr.seguroMolde?.velocidad), v(pr.seguroMolde?.presion), '—'],
      ['Botador',         v(pr.botador?.velocidad),     v(pr.botador?.presion),     v(pr.botador?.numSalidas)],
    ],
    styles:     { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 37, halign: 'center' },
      2: { cellWidth: 37, halign: 'center' },
      3: { cellWidth: 38, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // Temperaturas
  let yT = doc.lastAutoTable.finalY + 8;
  doc.setTextColor(...azul);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TEMPERATURAS', 14, yT);
  yT += 3;

  autoTable(doc, {
    startY: yT,
    head: [['Boquilla', 'Z1', 'Z2', 'Z3']],
    body: [[v(tm.boquilla), v(tm.z1), v(tm.z2), v(tm.z3)]],
    styles:     { fontSize: 9, cellPadding: 3, halign: 'center' },
    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 45.5 },
      1: { cellWidth: 45.5 },
      2: { cellWidth: 45.5 },
      3: { cellWidth: 45.5 },
    },
    margin: { left: 14, right: 14 },
  });

  // Tiempos
  let yTi = doc.lastAutoTable.finalY + 8;
  doc.setTextColor(...azul);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TIEMPOS (s)', 14, yTi);
  yTi += 3;

  autoTable(doc, {
    startY: yTi,
    head: [['Concepto', 'Consigna (s)']],
    body: [
      ['Enfriamiento',         v(ti.enfriamiento)],
      ['Pausa',                v(ti.pausa)],
      ['Retardo de inyección', v(ti.retardoInyeccion)],
      ['Inyección',            v(ti.inyeccion)],
      ['2a Inyección',         v(ti.segundaInyeccion)],
      ['Descompresión',        v(ti.descompresion)],
    ],
    styles:     { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 130 }, 1: { cellWidth: 52, halign: 'right' } },
    margin: { left: 14, right: 14 },
  });

  // ── Insumos requeridos ────────────────────────────────────────────────
  let yI = doc.lastAutoTable.finalY + 8;
  doc.setTextColor(...azul);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INSUMOS REQUERIDOS', 14, yI);
  yI += 3;

  const insumos = ficha.insumos ?? [];
  autoTable(doc, {
    startY: yI,
    head: [['Insumo', 'Cantidad', 'Unidad']],
    body: insumos.length > 0
      ? insumos.map(i => [i.name ?? '—', String(i.quantity ?? ''), i.unit ?? '—'])
      : [['Sin insumos registrados', '', '']],
    styles:     { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: azul, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 37, halign: 'right' },
      2: { cellWidth: 35, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // ── Notas ─────────────────────────────────────────────────────────────
  if (ficha.notas) {
    const notaY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.4);
    const lines = doc.splitTextToSize(ficha.notas, 168);
    doc.roundedRect(14, notaY, 182, 10 + lines.length * 5, 3, 3, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas:', 19, notaY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(lines, 19, notaY + 11);
  }

  // ── Pie de página ─────────────────────────────────────────────────────
  // Pie anclado al fondo real de la página para que no colisione con el contenido.
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(...azul);
  doc.rect(0, pageH - 12, 210, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('JRepuestos — Documento generado automáticamente', 105, pageH - 5, { align: 'center' });

  // El nombre del archivo incluye el código de ficha para facilitar el archivado ordenado.
  doc.save(`ficha_tecnica_${ficha.codigoFicha ?? 'sin_codigo'}.pdf`);
}
