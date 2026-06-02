// ─── User repository — Drizzle/SQLite implementation ───────────────────────

import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IUserRepository } from "@/core/ports/user-repository";
import type { User, UserProfile, UserRole } from "@/core/entities/user";

function rowToUser(row: typeof schema.users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    image: row.image,
    createdAt: row.createdAt,
  };
}

function rowToProfile(row: typeof schema.userProfiles.$inferSelect): UserProfile {
  return {
    id: row.id,
    userId: row.userId,
    clubId: row.clubId,
    role: row.role as UserRole,
    memberType: row.memberType,
    displayName: row.displayName,
    phone: row.phone,
    level: row.level,
    joinedAt: row.joinedAt,
  };
}

export const userRepo: IUserRepository = {
  async findById(id: string) {
    const row = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .get();
    return row ? rowToUser(row) : null;
  },

  async findByEmail(email: string) {
    const row = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .get();
    return row ? rowToUser(row) : null;
  },

  async create(input) {
    const id = uuid();
    const now = new Date();

    db.insert(schema.users)
      .values({
        id,
        email: input.email,
        name: input.name,
        passwordHash: input.passwordHash,
        image: input.image,
        createdAt: now,
      })
      .run();

    const row = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .get()!;

    return rowToUser(row);
  },

  async getProfile(userId, clubId) {
    const row = db
      .select()
      .from(schema.userProfiles)
      .where(
        and(
          eq(schema.userProfiles.userId, userId),
          eq(schema.userProfiles.clubId, clubId)
        )
      )
      .get();
    return row ? rowToProfile(row) : null;
  },

  async upsertProfile(input) {
    const existing = db
      .select()
      .from(schema.userProfiles)
      .where(
        and(
          eq(schema.userProfiles.userId, input.userId),
          eq(schema.userProfiles.clubId, input.clubId)
        )
      )
      .get();

    if (existing) {
      db.update(schema.userProfiles)
        .set({
          role: input.role,
          memberType: input.memberType,
          displayName: input.displayName,
          phone: input.phone,
          level: input.level,
        })
        .where(eq(schema.userProfiles.id, existing.id))
        .run();

      const row = db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.id, existing.id))
        .get()!;
      return rowToProfile(row);
    }

    const id = uuid();
    const now = new Date();

    db.insert(schema.userProfiles)
      .values({
        id,
        userId: input.userId,
        clubId: input.clubId,
        role: input.role,
        memberType: input.memberType,
        displayName: input.displayName,
        phone: input.phone,
        level: input.level,
        joinedAt: now,
      })
      .run();

    const row = db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.id, id))
      .get()!;
    return rowToProfile(row);
  },

  async listClubMembers(clubId) {
    const rows = db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.clubId, clubId))
      .all();
    return rows.map(rowToProfile);
  },

  async updateRole(profileId, role) {
    db.update(schema.userProfiles)
      .set({ role })
      .where(eq(schema.userProfiles.id, profileId))
      .run();

    const row = db
      .select()
      .from(schema.userProfiles)
      .where(eq(schema.userProfiles.id, profileId))
      .get()!;
    return rowToProfile(row);
  },
};
