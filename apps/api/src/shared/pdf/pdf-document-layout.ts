import PDFDocument from 'pdfkit';

export type PdfLineItem = {
  description: string;
  quantity: number;
  unitPriceAmount: number;
  /** Precomputed line total from persisted unit × qty (display). */
  lineTotalAmount: number;
};

export type PdfTotals = {
  subtotalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  currency: string;
};

type DrawTableArgs = {
  doc: PDFKit.PDFDocument;
  items: PdfLineItem[];
  currency: string;
  formatMoney: (amount: number, currency: string) => string;
};

/**
 * Shared layout helpers for quotation/invoice PDFs.
 * Business totals must be supplied from persisted records — never recalculated here.
 */
export function createPdfDocument(): PDFKit.PDFDocument {
  return new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Producer: 'EventOS',
      Creator: 'EventOS',
    },
  });
}

export function collectPdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}

export function drawBrandHeader(
  doc: PDFKit.PDFDocument,
  businessName: string,
  subtitle: string,
): void {
  doc
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor('#1a1a1a')
    .text(businessName || 'We Decor Events', { align: 'left' });
  doc
    .moveDown(0.25)
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#555555')
    .text(subtitle);
  doc
    .moveDown(0.5)
    .strokeColor('#cccccc')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(1);
}

export function drawKeyValue(
  doc: PDFKit.PDFDocument,
  label: string,
  value: string,
): void {
  const startX = doc.x;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#666666').text(label, {
    continued: false,
    width: 120,
  });
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#1a1a1a')
    .text(value || '—', startX + 120, doc.y - 12, { width: 350 });
  doc.moveDown(0.35);
}

export function ensureSpace(doc: PDFKit.PDFDocument, needed: number): void {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (doc.y + needed > bottom) {
    doc.addPage();
  }
}

export function drawLineItemsTable({
  doc,
  items,
  currency,
  formatMoney,
}: DrawTableArgs): void {
  const colX = { desc: 50, qty: 320, unit: 370, total: 460 };
  const headerY = doc.y;

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333');
  doc.text('Description', colX.desc, headerY, { width: 250 });
  doc.text('Qty', colX.qty, headerY, { width: 40, align: 'right' });
  doc.text('Unit', colX.unit, headerY, { width: 80, align: 'right' });
  doc.text('Amount', colX.total, headerY, { width: 85, align: 'right' });
  doc
    .moveTo(50, headerY + 14)
    .lineTo(545, headerY + 14)
    .strokeColor('#dddddd')
    .stroke();
  doc.y = headerY + 20;

  if (items.length === 0) {
    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor('#777777')
      .text('No line items.');
    return;
  }

  for (const item of items) {
    const description = (item.description || 'Item').trim() || 'Item';
    const descHeight = doc.heightOfString(description, { width: 250 });
    ensureSpace(doc, Math.max(descHeight, 14) + 8);
    const y = doc.y;
    doc.font('Helvetica').fontSize(9).fillColor('#1a1a1a');
    doc.text(description, colX.desc, y, { width: 250 });
    const rowBottom = doc.y;
    doc.text(String(item.quantity), colX.qty, y, {
      width: 40,
      align: 'right',
    });
    doc.text(formatMoney(item.unitPriceAmount, currency), colX.unit, y, {
      width: 80,
      align: 'right',
    });
    doc.text(formatMoney(item.lineTotalAmount, currency), colX.total, y, {
      width: 85,
      align: 'right',
    });
    doc.y = Math.max(rowBottom, y + 12) + 6;
  }
}

export function drawTotalsBlock(
  doc: PDFKit.PDFDocument,
  totals: PdfTotals,
  formatMoney: (amount: number, currency: string) => string,
  extraRows: Array<{ label: string; amount: number }> = [],
): void {
  ensureSpace(doc, 90);
  doc.moveDown(0.5);
  const rows: Array<{ label: string; amount: number; bold?: boolean }> = [
    { label: 'Subtotal', amount: totals.subtotalAmount },
  ];
  if (totals.discountAmount != null && totals.discountAmount !== 0) {
    rows.push({ label: 'Discount', amount: totals.discountAmount });
  }
  if (totals.taxAmount != null && totals.taxAmount !== 0) {
    rows.push({ label: 'Tax', amount: totals.taxAmount });
  }
  for (const row of extraRows) {
    rows.push(row);
  }
  rows.push({ label: 'Total', amount: totals.totalAmount, bold: true });

  for (const row of rows) {
    doc
      .font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(row.bold ? 11 : 10)
      .fillColor('#1a1a1a');
    doc.text(row.label, 350, doc.y, { width: 90, align: 'right', continued: false });
    const y = doc.y - 12;
    doc.text(formatMoney(row.amount, totals.currency), 450, y, {
      width: 95,
      align: 'right',
    });
    doc.moveDown(0.35);
  }
}

export function drawFooterNotes(
  doc: PDFKit.PDFDocument,
  notes: string | null | undefined,
  terms: string | null | undefined,
): void {
  if (!notes && !terms) return;
  ensureSpace(doc, 60);
  doc.moveDown(1);
  if (notes) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#333333').text('Notes');
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#444444')
      .text(notes, { width: 495 });
    doc.moveDown(0.5);
  }
  if (terms) {
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#333333')
      .text('Payment terms');
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#444444')
      .text(terms, { width: 495 });
  }
}
