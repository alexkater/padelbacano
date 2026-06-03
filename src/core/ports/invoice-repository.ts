import type { Invoice, InvoiceItem } from "../entities/invoice";

export interface IInvoiceRepository {
  listByClub(clubId: string): Promise<Invoice[]>;
  findById(id: string): Promise<Invoice | null>;
  create(input: Omit<Invoice, "id" | "createdAt" | "updatedAt" | "items">, items: Omit<InvoiceItem, "id" | "invoiceId">[]): Promise<Invoice>;
  updateStatus(id: string, status: Invoice["status"], dianInfo?: { cufe?: string; xml?: string; dianStatus?: Invoice["dianStatus"] }): Promise<Invoice>;
  getNextConsecutive(clubId: string, prefix: string): Promise<number>;
  generatePDF(invoice: Invoice): Promise<Buffer>;
}
