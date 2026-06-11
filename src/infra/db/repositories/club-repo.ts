// ─── Club repository — Drizzle/SQLite implementation ───────────────────────

import { eq } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IClubRepository } from "@/core/ports/club-repository";
import type { Club } from "@/core/entities/club";
import type { Court } from "@/core/entities/court";

function rowToClub(row: typeof schema.clubs.$inferSelect, courts: Court[] = []): Club {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    pricing: row.pricing,
    theme: row.theme,
    cancellationPolicy: row.cancellationPolicy,
    contact: row.contact,
    content: row.content,
    courts,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function courtRowToEntity(row: typeof schema.courts.$inferSelect): Court {
  return {
    id: row.id,
    clubId: row.clubId,
    name: row.name,
    courtType: row.courtType,
    indoor: row.indoor,
    isActive: row.isActive,
    order: row.order,
    createdAt: row.createdAt,
  };
}

export const clubRepo: IClubRepository = {
  async findBySlug(slug: string) {
    const row = (await db
      .select()
      .from(schema.clubs)
      .where(eq(schema.clubs.slug, slug))
      .limit(1))[0];

    if (!row) return null;

    const courtRows = await db
      .select()
      .from(schema.courts)
      .where(eq(schema.courts.clubId, row.id));

    return rowToClub(row, courtRows.map(courtRowToEntity));
  },

  async findById(id: string) {
    const row = (await db
      .select()
      .from(schema.clubs)
      .where(eq(schema.clubs.id, id))
      .limit(1))[0];

    if (!row) return null;

    const courtRows = await db
      .select()
      .from(schema.courts)
      .where(eq(schema.courts.clubId, row.id));

    return rowToClub(row, courtRows.map(courtRowToEntity));
  },

  async listAll() {
    const rows = await db.select().from(schema.clubs);
    return Promise.all(
      rows.map(async (row) => {
        const courtRows = await db
          .select()
          .from(schema.courts)
          .where(eq(schema.courts.clubId, row.id));
        return rowToClub(row, courtRows.map(courtRowToEntity));
      })
    );
  },

  async create(input) {
    const id = uuid();
    const now = new Date();

    await db.insert(schema.clubs)
      .values({
        id,
        slug: input.slug,
        name: input.name,
        pricing: input.pricing,
        theme: input.theme,
        cancellationPolicy: input.cancellationPolicy,
        contact: input.contact,
        content: input.content,
        createdAt: now,
        updatedAt: now,
      });

    const row = (await db
      .select()
      .from(schema.clubs)
      .where(eq(schema.clubs.id, id))
      .limit(1))[0]!;

    return rowToClub(row);
  },

  async updateTheme(clubId, theme) {
    const current = (await db
      .select()
      .from(schema.clubs)
      .where(eq(schema.clubs.id, clubId))
      .limit(1))[0];

    if (!current) throw new Error(`Club ${clubId} not found`);

    const merged = { ...current.theme, ...theme };
    const now = new Date();

    await db.update(schema.clubs)
      .set({ theme: merged, updatedAt: now })
      .where(eq(schema.clubs.id, clubId));

    const row = (await db
      .select()
      .from(schema.clubs)
      .where(eq(schema.clubs.id, clubId))
      .limit(1))[0]!;

    return rowToClub(row);
  },

  async updateContent(clubId, content) {
    const current = (await db
      .select()
      .from(schema.clubs)
      .where(eq(schema.clubs.id, clubId))
      .limit(1))[0];

    if (!current) throw new Error(`Club ${clubId} not found`);

    const merged = { ...current.content, ...content };
    const now = new Date();

    await db.update(schema.clubs)
      .set({ content: merged, updatedAt: now })
      .where(eq(schema.clubs.id, clubId));

    const row = (await db
      .select()
      .from(schema.clubs)
      .where(eq(schema.clubs.id, clubId))
      .limit(1))[0]!;

    return rowToClub(row);
  },
};
