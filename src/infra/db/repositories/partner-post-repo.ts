// ─── Partner post repository — Drizzle/SQLite implementation ────────────────

import { eq, and, desc } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IPartnerPostRepository } from "@/core/ports/partner-post-repository";
import type { PartnerPost } from "@/core/entities/partner-post";

function rowToEntity(row: typeof schema.partnerPosts.$inferSelect): PartnerPost {
  return {
    id: row.id,
    clubId: row.clubId,
    userId: row.userId,
    name: row.name,
    level: row.level,
    schedule: row.schedule,
    notes: row.notes,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

export const partnerPostRepo: IPartnerPostRepository = {
  async listActive(clubId) {
    const rows = db
      .select()
      .from(schema.partnerPosts)
      .where(
        and(
          eq(schema.partnerPosts.clubId, clubId),
          eq(schema.partnerPosts.isActive, true)
        )
      )
      .orderBy(desc(schema.partnerPosts.createdAt))
      .all();
    return rows.map(rowToEntity);
  },

  async create(input) {
    const id = uuid();
    const now = new Date();

    db.insert(schema.partnerPosts)
      .values({
        id,
        clubId: input.clubId,
        userId: input.userId,
        name: input.name,
        level: input.level,
        schedule: input.schedule,
        notes: input.notes ?? null,
        isActive: true,
        createdAt: now,
      })
      .run();

    const row = db
      .select()
      .from(schema.partnerPosts)
      .where(eq(schema.partnerPosts.id, id))
      .get()!;
    return rowToEntity(row);
  },

  async deactivate(id) {
    db.update(schema.partnerPosts)
      .set({ isActive: false })
      .where(eq(schema.partnerPosts.id, id))
      .run();

    const row = db
      .select()
      .from(schema.partnerPosts)
      .where(eq(schema.partnerPosts.id, id))
      .get()!;
    return rowToEntity(row);
  },
};
