// ─── Announcement repository — Drizzle/SQLite implementation ────────────────

import { eq, and, desc } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IAnnouncementRepository } from "@/core/ports/announcement-repository";
import type { Announcement, AnnouncementType } from "@/core/entities/announcement";

function rowToEntity(row: typeof schema.announcements.$inferSelect): Announcement {
  return {
    id: row.id,
    clubId: row.clubId,
    title: row.title,
    content: row.content,
    type: row.type as AnnouncementType,
    isPublished: row.isPublished,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const announcementRepo: IAnnouncementRepository = {
  async listPublished(clubId) {
    const rows = db
      .select()
      .from(schema.announcements)
      .where(
        and(
          eq(schema.announcements.clubId, clubId),
          eq(schema.announcements.isPublished, true)
        )
      )
      .orderBy(desc(schema.announcements.createdAt))
      .all();
    return rows.map(rowToEntity);
  },

  async listAll(clubId) {
    const rows = db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.clubId, clubId))
      .orderBy(desc(schema.announcements.createdAt))
      .all();
    return rows.map(rowToEntity);
  },

  async findById(id) {
    const row = db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.id, id))
      .get();
    return row ? rowToEntity(row) : null;
  },

  async create(input) {
    const id = uuid();
    const now = new Date();

    db.insert(schema.announcements)
      .values({
        id,
        clubId: input.clubId,
        title: input.title,
        content: input.content,
        type: input.type,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const row = db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.id, id))
      .get()!;
    return rowToEntity(row);
  },

  async update(id, input) {
    const existing = db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.id, id))
      .get();
    if (!existing) throw new Error(`Announcement ${id} not found`);

    const now = new Date();
    db.update(schema.announcements)
      .set({
        ...(input.title !== undefined && { title: input.title }),
        ...(input.content !== undefined && { content: input.content }),
        ...(input.type !== undefined && { type: input.type }),
        ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
        updatedAt: now,
      })
      .where(eq(schema.announcements.id, id))
      .run();

    const row = db
      .select()
      .from(schema.announcements)
      .where(eq(schema.announcements.id, id))
      .get()!;
    return rowToEntity(row);
  },

  async delete(id) {
    db.delete(schema.announcements)
      .where(eq(schema.announcements.id, id))
      .run();
  },
};
