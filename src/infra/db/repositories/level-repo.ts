import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { ILevelRepository } from "@/core/ports/level-repository";
import type { PlayerLevel } from "@/core/entities/level";

const K_FACTOR = 32;
function row(r: typeof schema.playerLevels.$inferSelect): PlayerLevel { return { ...r, updatedAt: r.updatedAt }; }

export const levelRepo: ILevelRepository = {
  async getLevel(userId, clubId) {
    const r = db.select().from(schema.playerLevels).where(and(eq(schema.playerLevels.userId, userId), eq(schema.playerLevels.clubId, clubId))).get();
    return r ? row(r) : null;
  },
  async upsertLevel(input) {
    const existing = db.select().from(schema.playerLevels).where(and(eq(schema.playerLevels.userId, input.userId), eq(schema.playerLevels.clubId, input.clubId))).get();
    if (existing) {
      const now = new Date();
      db.update(schema.playerLevels).set({ rating: input.rating, level: input.level, matchesPlayed: input.matchesPlayed, matchesWon: input.matchesWon, updatedAt: now }).where(eq(schema.playerLevels.id, existing.id)).run();
      return row(db.select().from(schema.playerLevels).where(eq(schema.playerLevels.id, existing.id)).get()!);
    }
    const id = uuid(); const now = new Date();
    db.insert(schema.playerLevels).values({ id, userId: input.userId, clubId: input.clubId, rating: input.rating, level: input.level, matchesPlayed: input.matchesPlayed, matchesWon: input.matchesWon, updatedAt: now }).run();
    return row(db.select().from(schema.playerLevels).where(eq(schema.playerLevels.id, id)).get()!);
  },
  async updateRating(userId, clubId, won) {
    const current = await this.getLevel(userId, clubId);
    const rating = current ? current.rating : 1000;
    const matchesPlayed = (current?.matchesPlayed ?? 0) + 1;
    const matchesWon = (current?.matchesWon ?? 0) + (won ? 1 : 0);
    const expected = 1 / (1 + Math.pow(10, (1500 - rating) / 400));
    const newRating = Math.round(rating + K_FACTOR * ((won ? 1 : 0) - expected));
    const newLevel = Math.min(7, Math.max(1, Math.floor(newRating / 200)));
    return this.upsertLevel({ userId, clubId, rating: newRating, level: newLevel, matchesPlayed, matchesWon });
  },
  async listByClub(clubId) {
    return db.select().from(schema.playerLevels).where(eq(schema.playerLevels.clubId, clubId)).all().map(row);
  },
};
