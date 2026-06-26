import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IInvoiceRepository, InvoiceFilters } from "@/core/ports/invoice-repository";
import type { Invoice, InvoiceItem } from "@/core/entities/invoice";

function invRow(r: typeof schema.invoices.$inferSelect): Invoice {
  return { ...r, createdAt: r.createdAt, updatedAt: r.updatedAt };
}
function itemRow(r: typeof schema.invoiceItems.$inferSelect): InvoiceItem {
  return { ...r };
}

export const invoiceRepo: IInvoiceRepository = {
  async listByClub(clubId) {
    const rows = db.select().from(schema.invoices).where(eq(schema.invoices.clubId, clubId)).orderBy(desc(schema.invoices.issueDate)).all();
    return Promise.all(rows.map(async r => {
      const items = db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, r.id)).all().map(itemRow);
      return { ...invRow(r), items };
    }));
  },
  async listByClubFiltered(clubId, filters: InvoiceFilters = {}) {
    const conditions: ReturnType<typeof eq>[] = [eq(schema.invoices.clubId, clubId)];
    if (filters.status) {
      conditions.push(eq(schema.invoices.status, filters.status as any));
    }
    if (filters.from) {
      conditions.push(gte(schema.invoices.issueDate, new Date(filters.from)));
    }
    if (filters.to) {
      conditions.push(lte(schema.invoices.issueDate, new Date(filters.to)));
    }
    const where = and(...conditions);
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 20;
    const totalRow = db.select({ count: sql<number>`count(*)` }).from(schema.invoices).where(where).get();
    const total = totalRow?.count ?? 0;
    const rows = db.select().from(schema.invoices).where(where).orderBy(desc(schema.invoices.issueDate)).limit(limit).offset(offset).all();
    const invoices = await Promise.all(rows.map(async r => {
      const items = db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, r.id)).all().map(itemRow);
      return { ...invRow(r), items };
    }));
    return { items: invoices, total, offset, limit };
  },
  async findById(id) {
    const r = db.select().from(schema.invoices).where(eq(schema.invoices.id, id)).get();
    if (!r) return null;
    const items = db.select().from(schema.invoiceItems).where(eq(schema.invoiceItems.invoiceId, id)).all().map(itemRow);
    return { ...invRow(r), items };
  },
  async create(input, items) {
    const id = uuid(); const now = new Date();
    db.insert(schema.invoices).values({
      dianCufe: null, dianXml: null, dianStatus: null,
      id, clubId: input.clubId, userId: input.userId, invoiceNumber: input.invoiceNumber, prefix: input.prefix,
      consecutive: input.consecutive, issueDate: input.issueDate, dueDate: input.dueDate,
      subtotal: input.subtotal, taxRate: input.taxRate, taxAmount: input.taxAmount, total: input.total,
      currency: input.currency, status: "draft",
      customerName: input.customerName, customerDocument: input.customerDocument,
      customerDocumentType: input.customerDocumentType, customerEmail: input.customerEmail,
      customerPhone: input.customerPhone, customerAddress: input.customerAddress,
      paymentMethod: input.paymentMethod, notes: input.notes,
      nit: input.nit ?? null,
      createdAt: now, updatedAt: now,
    }).run();

    for (const item of items) {
      db.insert(schema.invoiceItems).values({
        id: uuid(), invoiceId: id, description: item.description,
        quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal,
        bookingId: item.bookingId ?? null,
      }).run();
    }

    return (await this.findById(id))!;
  },
  async updateStatus(id, status, dianInfo) {
    const now = new Date();
    const updates: Record<string, unknown> = { status, updatedAt: now };
    if (dianInfo?.cufe) updates.dianCufe = dianInfo.cufe;
    if (dianInfo?.xml) updates.dianXml = dianInfo.xml;
    if (dianInfo?.dianStatus) updates.dianStatus = dianInfo.dianStatus;
    db.update(schema.invoices).set(updates as any).where(eq(schema.invoices.id, id)).run();
    return (await this.findById(id))!;
  },
  async getNextConsecutive(clubId, prefix) {
    const r = db.select({ max: sql<number>`COALESCE(MAX(${schema.invoices.consecutive}), 0)` }).from(schema.invoices).where(and(eq(schema.invoices.clubId, clubId), eq(schema.invoices.prefix, prefix))).get();
    return (r?.max ?? 0) + 1;
  },
  async generatePDF(invoice) {
    const { clubRepo, clubConfigRepo } = await import("./index");
    const { generateInvoicePdf } = await import("@/lib/pdf-generator");

    const club = await clubRepo.findById(invoice.clubId);
    const name = club?.name ?? "Club";

    let clubNit: string | null = null;
    let address: string | null = club?.contact.address ?? null;
    let phone: string | null = club?.contact.phone ?? null;
    let email: string | null = club?.contact.email ?? null;

    if (club?.slug) {
      const config = await clubConfigRepo.getBySlug(club.slug);
      if (config) {
        if (!clubNit) clubNit = config.contact.nit;
        if (!phone) phone = config.contact.phone;
        if (!email) email = config.contact.email;
      }
    }

    return generateInvoicePdf(invoice, { name, nit: clubNit, address, phone, email });
  },
};
