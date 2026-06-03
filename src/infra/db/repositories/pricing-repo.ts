import { eq, and, lte, gte, or, isNull } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IPricingRepository } from "@/core/ports/pricing-repository";
import type { PricingRule } from "@/core/entities/pricing";

function row(r: typeof schema.pricingRules.$inferSelect): PricingRule { return { ...r, createdAt: r.createdAt }; }

export const pricingRepo: IPricingRepository = {
  async listRules(clubId) {
    return db.select().from(schema.pricingRules).where(eq(schema.pricingRules.clubId, clubId)).all().map(row);
  },
  async getActiveRule(clubId, dayOfWeek, hour) {
    const r = db.select().from(schema.pricingRules).where(and(eq(schema.pricingRules.clubId, clubId), eq(schema.pricingRules.isActive, true), or(isNull(schema.pricingRules.dayOfWeek), eq(schema.pricingRules.dayOfWeek, dayOfWeek)), or(isNull(schema.pricingRules.startHour), lte(schema.pricingRules.startHour, hour)), or(isNull(schema.pricingRules.endHour), gte(schema.pricingRules.endHour, hour + 1)))).get();
    return r ? row(r) : null;
  },
  async create(input) {
    const id = uuid(); const now = new Date();
    db.insert(schema.pricingRules).values({ id, ...input, createdAt: now }).run();
    return row(db.select().from(schema.pricingRules).where(eq(schema.pricingRules.id, id)).get()!);
  },
  async update(id, input) {
    db.update(schema.pricingRules).set(input as any).where(eq(schema.pricingRules.id, id)).run();
    return row(db.select().from(schema.pricingRules).where(eq(schema.pricingRules.id, id)).get()!);
  },
  async delete(id) { db.delete(schema.pricingRules).where(eq(schema.pricingRules.id, id)).run(); },
};
