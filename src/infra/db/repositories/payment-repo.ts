import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IPaymentRepository } from "@/core/ports/payment-repository";
import type { PaymentMethod, Transaction, PaymentProvider, TransactionStatus } from "@/core/entities/payment";

function methodRow(r: typeof schema.paymentMethods.$inferSelect): PaymentMethod { return { ...r, config: r.config ?? {}, createdAt: r.createdAt }; }
function txRow(r: typeof schema.transactions.$inferSelect): Transaction { return { ...r, metadata: r.metadata ?? {}, createdAt: r.createdAt, updatedAt: r.updatedAt }; }

export const paymentRepo: IPaymentRepository = {
  async listMethods(clubId) {
    return db.select().from(schema.paymentMethods).where(and(eq(schema.paymentMethods.clubId, clubId), eq(schema.paymentMethods.isEnabled, true))).all().map(methodRow);
  },
  async enableMethod(clubId, provider, config) {
    const existing = db.select().from(schema.paymentMethods).where(and(eq(schema.paymentMethods.clubId, clubId), eq(schema.paymentMethods.provider, provider))).get();
    if (existing) {
      db.update(schema.paymentMethods).set({ isEnabled: true, config }).where(eq(schema.paymentMethods.id, existing.id)).run();
      return methodRow(db.select().from(schema.paymentMethods).where(eq(schema.paymentMethods.id, existing.id)).get()!);
    }
    const id = uuid(); const now = new Date();
    const nameMap: Record<string, string> = { pse: "PSE", nequi: "Nequi", daviplata: "Daviplata", credit_card: "Tarjeta", cash: "Efectivo" };
    db.insert(schema.paymentMethods).values({ id, clubId, provider, name: nameMap[provider] || provider, isEnabled: true, config, createdAt: now }).run();
    return methodRow(db.select().from(schema.paymentMethods).where(eq(schema.paymentMethods.id, id)).get()!);
  },
  async createTransaction(input) {
    const id = uuid(); const now = new Date();
    db.insert(schema.transactions).values({ id, clubId: input.clubId, bookingId: input.bookingId ?? null, userId: input.userId, amount: input.amount, currency: input.currency, method: input.method, status: "pending", createdAt: now, updatedAt: now }).run();
    return txRow(db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).get()!);
  },
  async updateStatus(id, status, gatewayRef) {
    const now = new Date();
    const updates: Record<string, unknown> = { status, updatedAt: now };
    if (gatewayRef) updates.gatewayRef = gatewayRef;
    db.update(schema.transactions).set(updates as any).where(eq(schema.transactions.id, id)).run();
    return txRow(db.select().from(schema.transactions).where(eq(schema.transactions.id, id)).get()!);
  },
  async getByBooking(bookingId) {
    const r = db.select().from(schema.transactions).where(eq(schema.transactions.bookingId, bookingId)).get();
    return r ? txRow(r) : null;
  },
  async listByClub(clubId) {
    return db.select().from(schema.transactions).where(eq(schema.transactions.clubId, clubId)).all().map(txRow);
  },
  async getTotalRevenue(clubId, from, to) {
    const rows = db.select().from(schema.transactions).where(and(eq(schema.transactions.clubId, clubId), eq(schema.transactions.status, "completed"))).all();
    return rows.filter(r => r.createdAt >= from && r.createdAt <= to).reduce((sum, r) => sum + r.amount, 0);
  },
};
