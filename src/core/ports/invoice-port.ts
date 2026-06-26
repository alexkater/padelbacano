// ─── Invoice port — DIAN-ready invoice generation ──────────────────────────
//
// PádelBacano NO es emisor DIAN. El club (merchant of record) factura al
// jugador. La plataforma genera los datos estructurados, PDF y XML para que
// el club los exporte o los envíe a su contador/software DIAN.
//
// Todos los valores monetarios están en centavos COP (enteros). Nunca floats.
// ─────────────────────────────────────────────────────────────────────────────

import type { Invoice, InvoiceItem } from "../entities/invoice";

/** Estados de una factura en el ciclo de vida DIAN-ready */
export type InvoiceStatus = "pending" | "issued" | "cancelled";

/** Filtros para listar facturas */
export interface InvoiceFilter {
  clubId: string;
  status?: InvoiceStatus;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

/** Resultado de exportación PDF */
export interface PdfExport {
  /** Buffer del PDF generado */
  buffer: Buffer;
  /** Nombre sugerido para el archivo (ej: FAC-001-000123.pdf) */
  filename: string;
  /** Tipo MIME */
  mimeType: "application/pdf";
}

/** Resultado de exportación XML DIAN */
export interface XmlExport {
  /** Contenido del XML como string */
  xml: string;
  /** Nombre sugerido para el archivo (ej: FAC-001-000123.xml) */
  filename: string;
  /** Tipo MIME */
  mimeType: "application/xml";
  /** CUFE — Código Único de Factura Electrónica (futuro) */
  cufe: string | null;
}

/**
 * Puerto de generación de facturas DIAN-ready.
 *
 * Separa la lógica de generación (PDF, XML, CUFE) del repositorio de
 * persistencia ({@link IInvoiceRepository}). Los use cases orquestan ambos.
 */
export interface InvoicePort {
  /**
   * Genera una factura a partir de una reserva.
   * Crea la entidad Invoice en estado "pending" con items, subtotal, IVA y total.
   *
   * @param bookingId - ID de la reserva facturada
   * @returns Invoice generada con items poblados
   */
  generateInvoice(bookingId: string): Promise<Invoice>;

  /**
   * Obtiene una factura por su ID, incluyendo items.
   *
   * @param id - ID de la factura
   * @returns Invoice con items, o null si no existe
   */
  getInvoice(id: string): Promise<Invoice | null>;

  /**
   * Lista facturas aplicando filtros.
   *
   * @param filter - Filtros de búsqueda (club, estado, rango de fechas, paginación)
   * @returns Tupla [facturas, totalCount] para paginación
   */
  listInvoices(filter: InvoiceFilter): Promise<[Invoice[], number]>;

  /**
   * Exporta una factura a PDF.
   *
   * @param invoiceId - ID de la factura a exportar
   * @returns PdfExport con buffer, filename y mimeType
   */
  exportPDF(invoiceId: string): Promise<PdfExport>;

  /**
   * Exporta una factura a XML DIAN-ready.
   * Incluye CUFE si la factura ya fue emitida y firmada.
   *
   * @param invoiceId - ID de la factura a exportar
   * @returns XmlExport con xml, filename, mimeType y cufe
   */
  exportXML(invoiceId: string): Promise<XmlExport>;
}
