// ─── Club config repository — Drizzle/PostgreSQL implementation ───────────

import { eq } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type {
  ClubConfig,
  ClubConfigStatus,
  CreateClubConfigData,
  IClubConfigPort,
  UpdateClubConfigData,
} from "@/core/ports/club-config-port";

class ClubConfigPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClubConfigPersistenceError";
  }
}

type ClubConfigRow = typeof schema.clubConfigs.$inferSelect;
type ClubConfigInsert = typeof schema.clubConfigs.$inferInsert;

function rowToClubConfig(row: ClubConfigRow): ClubConfig {
  return {
    id: row.id,
    clubId: row.clubId,
    slug: row.slug,
    name: row.name,
    city: row.city,
    department: row.department,
    status: row.status,
    verified: row.verified,
    theme: row.theme,
    pricing: row.pricing,
    modules: row.modules,
    cancellationPolicy: row.cancellationPolicy,
    contact: {
      nit: row.nit,
      phone: row.phone,
      email: row.email,
      domain: row.domain,
      logoUrl: row.logoUrl,
      heroImageUrl: row.heroImageUrl,
    },
    createdAt: row.createdAt,
  };
}

function dataToInsert(data: CreateClubConfigData): ClubConfigInsert {
  return {
    id: uuid(),
    clubId: data.clubId,
    slug: data.slug,
    name: data.name,
    city: data.city,
    department: data.department,
    nit: data.contact.nit,
    phone: data.contact.phone,
    email: data.contact.email,
    logoUrl: data.contact.logoUrl,
    heroImageUrl: data.contact.heroImageUrl,
    domain: data.contact.domain,
    theme: data.theme,
    pricing: data.pricing,
    modules: data.modules,
    status: data.status,
    verified: data.verified,
    cancellationPolicy: data.cancellationPolicy,
  };
}

function dataToUpdate(data: UpdateClubConfigData): Partial<ClubConfigInsert> {
  return {
    ...(data.clubId !== undefined ? { clubId: data.clubId } : {}),
    ...(data.slug !== undefined ? { slug: data.slug } : {}),
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.city !== undefined ? { city: data.city } : {}),
    ...(data.department !== undefined ? { department: data.department } : {}),
    ...(data.contact !== undefined
      ? {
          nit: data.contact.nit,
          phone: data.contact.phone,
          email: data.contact.email,
          logoUrl: data.contact.logoUrl,
          heroImageUrl: data.contact.heroImageUrl,
          domain: data.contact.domain,
        }
      : {}),
    ...(data.theme !== undefined ? { theme: data.theme } : {}),
    ...(data.pricing !== undefined ? { pricing: data.pricing } : {}),
    ...(data.modules !== undefined ? { modules: data.modules } : {}),
    ...(data.status !== undefined ? { status: data.status } : {}),
    ...(data.verified !== undefined ? { verified: data.verified } : {}),
    ...(data.cancellationPolicy !== undefined
      ? { cancellationPolicy: data.cancellationPolicy }
      : {}),
  };
}

function requireRow(row: ClubConfigRow | undefined, id: string): ClubConfig {
  if (!row) {
    throw new ClubConfigPersistenceError(`Club config ${id} was not persisted`);
  }

  return rowToClubConfig(row);
}

export const clubConfigRepo: IClubConfigPort = {
  async getBySlug(slug: string) {
    const rows = await db
      .select()
      .from(schema.clubConfigs)
      .where(eq(schema.clubConfigs.slug, slug))
      .limit(1);
    const row = rows[0];

    return row ? rowToClubConfig(row) : null;
  },

  async getById(id: string) {
    const rows = await db
      .select()
      .from(schema.clubConfigs)
      .where(eq(schema.clubConfigs.id, id))
      .limit(1);
    const row = rows[0];

    return row ? rowToClubConfig(row) : null;
  },

  async listActive() {
    const rows = await db
      .select()
      .from(schema.clubConfigs)
      .where(eq(schema.clubConfigs.status, "active"));

    return rows.map(rowToClubConfig);
  },

  async create(data) {
    const rows = await db
      .insert(schema.clubConfigs)
      .values(dataToInsert(data))
      .returning();

    return requireRow(rows[0], data.slug);
  },

  async update(id, data) {
    const rows = await db
      .update(schema.clubConfigs)
      .set(dataToUpdate(data))
      .where(eq(schema.clubConfigs.id, id))
      .returning();

    return requireRow(rows[0], id);
  },

  async updateStatus(id: string, status: ClubConfigStatus) {
    const rows = await db
      .update(schema.clubConfigs)
      .set({ status })
      .where(eq(schema.clubConfigs.id, id))
      .returning();

    return requireRow(rows[0], id);
  },
};
