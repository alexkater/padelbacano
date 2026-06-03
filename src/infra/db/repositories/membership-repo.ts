import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IMembershipRepository } from "@/core/ports/membership-repository";
import type { MembershipPlan, UserMembership } from "@/core/entities/membership";

function planRow(row: typeof schema.membershipPlans.$inferSelect): MembershipPlan {
  return { ...row, createdAt: row.createdAt };
}
function memberRow(row: typeof schema.userMemberships.$inferSelect): UserMembership {
  return { ...row, createdAt: row.createdAt };
}

export const membershipRepo: IMembershipRepository = {
  async listPlans(clubId) {
    return db.select().from(schema.membershipPlans).where(and(eq(schema.membershipPlans.clubId, clubId), eq(schema.membershipPlans.isActive, true))).all().map(planRow);
  },
  async findPlanById(id) {
    const r = db.select().from(schema.membershipPlans).where(eq(schema.membershipPlans.id, id)).get();
    return r ? planRow(r) : null;
  },
  async createPlan(input) {
    const id = uuid(); const now = new Date();
    db.insert(schema.membershipPlans).values({ id, clubId: input.clubId, name: input.name, description: input.description, price: input.price, currency: input.currency, interval: input.interval, benefits: input.benefits, isActive: true, createdAt: now }).run();
    return planRow(db.select().from(schema.membershipPlans).where(eq(schema.membershipPlans.id, id)).get()!);
  },
  async updatePlan(id, input) {
    const now = new Date();
    db.update(schema.membershipPlans).set({ ...input, updatedAt: now } as any).where(eq(schema.membershipPlans.id, id)).run();
    return planRow(db.select().from(schema.membershipPlans).where(eq(schema.membershipPlans.id, id)).get()!);
  },
  async getUserMembership(userId, clubId) {
    const r = db.select().from(schema.userMemberships).where(and(eq(schema.userMemberships.userId, userId), eq(schema.userMemberships.clubId, clubId), eq(schema.userMemberships.status, "active"))).get();
    return r ? memberRow(r) : null;
  },
  async createUserMembership(input) {
    const id = uuid(); const now = new Date();
    db.insert(schema.userMemberships).values({ id, userId: input.userId, planId: input.planId, clubId: input.clubId, status: "active", startDate: input.startDate, endDate: input.endDate, createdAt: now }).run();
    return memberRow(db.select().from(schema.userMemberships).where(eq(schema.userMemberships.id, id)).get()!);
  },
  async cancelUserMembership(id) {
    db.update(schema.userMemberships).set({ status: "cancelled" }).where(eq(schema.userMemberships.id, id)).run();
    return memberRow(db.select().from(schema.userMemberships).where(eq(schema.userMemberships.id, id)).get()!);
  },
};
