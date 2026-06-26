import PDFDocument from "pdfkit";
import type { Invoice } from "@/core/entities/invoice";

/** Lightweight club info needed for the PDF header */
export interface PdfClubInfo {
  name: string;
  nit: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

function formatCOP(cents: number): string {
  const pesos = cents / 100;
  return (
    "$ " +
    pesos
      .toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      .replace(/\s/g, ".")
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const MARGIN = 50;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COL_X = [MARGIN, MARGIN + 50, MARGIN + 230, MARGIN + 315, MARGIN + 405] as const;
const COL_WIDTHS = [50, 180, 85, 90, 90] as const;
const ROW_HEIGHT = 22;

const PRIMARY = "#1a3a2a";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const BORDER = "#d1d5db";
const BLACK = "#111827";

export function generateInvoicePdf(
  invoice: Invoice,
  clubInfo: PdfClubInfo,
  logoBuffer?: Buffer | null,
): Buffer {
  const doc = new PDFDocument({
    size: "A4",
    margin: MARGIN,
    info: {
      Title: `Factura ${invoice.invoiceNumber}`,
      Author: clubInfo.name,
      Subject: `Factura electrónica ${invoice.invoiceNumber}`,
      Keywords: `factura,${invoice.invoiceNumber},${clubInfo.name}`,
    },
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  drawHeader(doc, clubInfo, logoBuffer);
  drawInvoiceMeta(doc, invoice);
  drawCustomerBox(doc, invoice);
  drawItemsTable(doc, invoice);
  drawTotals(doc, invoice);
  drawFooter(doc, clubInfo, invoice);

  doc.end();

  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    const footerText = `Página ${i + 1} de ${totalPages} — ${clubInfo.name} — ${invoice.invoiceNumber}`;
    doc.fontSize(7).font("Helvetica").fillColor(GRAY);
    doc.text(footerText, MARGIN, 801.89, { align: "center", width: CONTENT_WIDTH });
  }

  return Buffer.concat(chunks);
}

function drawHeader(doc: PDFKit.PDFDocument, club: PdfClubInfo, logoBuffer?: Buffer | null) {
  if (logoBuffer) {
    try {
      doc.image(logoBuffer, MARGIN, 50, { width: 70, height: 70 });
    } catch {
      // skip bad image data
    }
  }

  const rightX = 320;
  doc.fontSize(16).font("Helvetica-Bold").fillColor(PRIMARY);
  doc.text(club.name, rightX, 50, { align: "right", width: 230 });

  let lineY = doc.y + 2;
  if (club.nit) {
    doc.fontSize(9).font("Helvetica").fillColor(GRAY);
    doc.text(`NIT: ${club.nit}`, rightX, lineY, { align: "right", width: 230 });
    lineY += 14;
  }
  if (club.address) {
    doc.fontSize(9).font("Helvetica").fillColor(GRAY);
    doc.text(club.address, rightX, lineY, { align: "right", width: 230 });
    lineY += 14;
  }
  if (club.phone) {
    doc.fontSize(9).font("Helvetica").fillColor(GRAY);
    doc.text(`Tel: ${club.phone}`, rightX, lineY, { align: "right", width: 230 });
    lineY += 14;
  }
  if (club.email) {
    doc.fontSize(9).font("Helvetica").fillColor(GRAY);
    doc.text(club.email, rightX, lineY, { align: "right", width: 230 });
  }

  const sepY = Math.max(130, doc.y + 15);
  doc.y = sepY;
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor(BORDER).lineWidth(1).stroke();
  doc.moveDown(1);
}

function drawInvoiceMeta(doc: PDFKit.PDFDocument, invoice: Invoice) {
  doc.fontSize(18).font("Helvetica-Bold").fillColor(PRIMARY);
  doc.text("FACTURA ELECTRÓNICA", MARGIN, doc.y + 5);

  doc.fontSize(12).font("Helvetica").fillColor(PRIMARY);
  doc.text(`No. ${invoice.invoiceNumber}`, { continued: false });
  doc.moveDown(0.3);

  doc.fontSize(9).font("Helvetica").fillColor(GRAY);
  doc.text(`Fecha de emisión: ${formatDate(invoice.issueDate)}`);
  if (invoice.dueDate) {
    doc.text(`Fecha de vencimiento: ${formatDate(invoice.dueDate)}`);
  }
  doc.moveDown(0.8);
}

function drawCustomerBox(doc: PDFKit.PDFDocument, invoice: Invoice) {
  const startY = doc.y;
  doc.rect(MARGIN, startY, CONTENT_WIDTH, 58).fillColor("#f9fafb").fill();
  doc.fillColor(BLACK);
  doc.y = startY + 6;
  doc.x = MARGIN + 8;

  doc.font("Helvetica-Bold").fontSize(10).fillColor(PRIMARY);
  doc.text("DATOS DEL CLIENTE");
  doc.moveDown(0.3);

  doc.font("Helvetica").fontSize(9).fillColor(BLACK);
  doc.text(`Nombre: ${invoice.customerName}`);
  if (invoice.customerDocument) {
    doc.text(`${invoice.customerDocumentType ?? "CC"}: ${invoice.customerDocument}`);
  }
  doc.text(`Email: ${invoice.customerEmail ?? "—"}  |  Tel: ${invoice.customerPhone ?? "—"}`);

  doc.y = startY + 58 + 12;
  doc.x = MARGIN;
}

function drawItemsTable(doc: PDFKit.PDFDocument, invoice: Invoice) {
  const tableTop = doc.y;

  const headers = ["#", "Descripción", "Cant.", "Valor Unit.", "Total"];
  doc.rect(MARGIN, tableTop, CONTENT_WIDTH, ROW_HEIGHT).fillColor(PRIMARY).fill();
  doc.fillColor("#ffffff");
  let cx = MARGIN + 6;
  headers.forEach((t, i) => {
    doc.font("Helvetica-Bold").fontSize(8);
    doc.text(t, cx, tableTop + 6, { width: COL_WIDTHS[i], align: i >= 2 ? "right" : "left" });
    cx += COL_WIDTHS[i];
  });

  let rowY = tableTop + ROW_HEIGHT;
  const items = invoice.items ?? [];

  items.forEach((item, idx) => {
    if (idx % 2 === 0) {
      doc.rect(MARGIN, rowY, CONTENT_WIDTH, ROW_HEIGHT).fillColor(LIGHT_GRAY).fill();
    }
    doc.fillColor(BLACK);
    doc.font("Helvetica").fontSize(8);

    doc.text(String(idx + 1), COL_X[0] + 6, rowY + 6, { width: COL_WIDTHS[0], align: "left" });
    const desc = item.description.length > 60 ? item.description.slice(0, 57) + "..." : item.description;
    doc.text(desc, COL_X[1] + 6, rowY + 6, { width: COL_WIDTHS[1], align: "left" });
    doc.text(String(item.quantity), COL_X[2] + 6, rowY + 6, { width: COL_WIDTHS[2], align: "right" });
    doc.text(formatCOP(item.unitPrice), COL_X[3] + 6, rowY + 6, { width: COL_WIDTHS[3], align: "right" });
    doc.text(formatCOP(item.subtotal), COL_X[4] + 6, rowY + 6, { width: COL_WIDTHS[4], align: "right" });

    rowY += ROW_HEIGHT;
  });

  doc.rect(MARGIN, tableTop, CONTENT_WIDTH, rowY - tableTop).strokeColor(BORDER).lineWidth(1).stroke();
  doc.y = rowY + 15;
}

function drawTotals(doc: PDFKit.PDFDocument, invoice: Invoice) {
  const totalsX = 340;
  const totalsW = 205;

  function totalLine(label: string, amount: string, bold: boolean = false) {
    const f = bold ? "Helvetica-Bold" : "Helvetica";
    const s = bold ? 12 : 10;
    const c = bold ? PRIMARY : BLACK;
    doc.font(f).fontSize(s).fillColor(c);
    doc.text(label, totalsX, doc.y, { width: totalsW * 0.55, align: "left", continued: true });
    doc.text(amount, { width: totalsW * 0.45, align: "right" });
    doc.moveDown(0.35);
  }

  totalLine("Subtotal:", formatCOP(invoice.subtotal));
  totalLine(`IVA (${(invoice.taxRate / 100).toFixed(1)}%):`, formatCOP(invoice.taxAmount));

  doc.moveDown(0.1);
  doc.moveTo(totalsX, doc.y).lineTo(totalsX + totalsW, doc.y).strokeColor(PRIMARY).lineWidth(2).stroke();
  doc.moveDown(0.4);

  totalLine("TOTAL:", formatCOP(invoice.total), true);
  doc.moveDown(0.3);

  doc.font("Helvetica-Oblique").fontSize(8).fillColor(GRAY);
  doc.text("Todos los valores están expresados en Pesos Colombianos (COP)", { align: "right", width: totalsW });
  doc.moveDown(0.5);

  if (invoice.paymentMethod) {
    doc.font("Helvetica").fontSize(9).fillColor(BLACK);
    doc.text(`Método de pago: ${invoice.paymentMethod}`, { align: "right", width: totalsW });
    doc.moveDown(0.3);
  }

  if (invoice.notes) {
    doc.font("Helvetica-Oblique").fontSize(8).fillColor(GRAY);
    doc.text(`Notas: ${invoice.notes}`, { align: "right", width: totalsW });
  }

  doc.moveDown(1);
}

function drawFooter(doc: PDFKit.PDFDocument, club: PdfClubInfo, invoice: Invoice) {
  if (invoice.dianCufe) {
    doc.moveDown(1);
    doc.fontSize(7).font("Helvetica").fillColor(GRAY);
    doc.text(`CUFE: ${invoice.dianCufe}`, { align: "center" });
    doc.text(`Factura electrónica validada por la DIAN — ${club.name}`, { align: "center" });
  }
}
