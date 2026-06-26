import type { Invoice, InvoiceItem } from "../entities/invoice";

export type InvoiceFilters = {
  status?: string;
  from?: string;
  to?: string;
  offset?: number;
  limit?: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  offset: number;
  limit: number;
};

export interface IInvoiceRepository {
  listByClub(clubId: string): Promise<Invoice[]>;
  listByClubFiltered(clubId: string, filters: InvoiceFilters): Promise<PaginatedResult<Invoice>>;
  findById(id: string): Promise<Invoice | null>;
  create(input: Omit<Invoice, "id" | "createdAt" | "updatedAt" | "items">, items: Omit<InvoiceItem, "id" | "invoiceId">[]): Promise<Invoice>;
  updateStatus(id: string, status: Invoice["status"], dianInfo?: { cufe?: string; xml?: string; dianStatus?: Invoice["dianStatus"] }): Promise<Invoice>;
  getNextConsecutive(clubId: string, prefix: string): Promise<number>;
  generatePDF(invoice: Invoice): Promise<Buffer>;
}
