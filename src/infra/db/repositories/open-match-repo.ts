import { eq, and, desc, sql } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IOpenMatchRepository } from "@/core/ports/open-match-repository";
import type { OpenMatch, OpenMatchPlayer } from "@/core/entities/open-match";

function matchRow(r: typeof schema.openMatches.$inferSelect): OpenMatch {
  return { ...r, createdAt: r.createdAt, playerCount: undefined };
}
function playerRow(r: typeof schema.openMatchPlayers.$inferSelect): OpenMatchPlayer {
  return { ...r, joinedAt: r.joinedAt };
}

export const openMatchRepo: IOpenMatchRepository = {
  async listOpen(clubId) {
    const rows = db.select().from(schema.openMatches).where(and(eq(schema.openMatches.clubId, clubId), eq(schema.openMatches.status, "open"))).orderBy(desc(schema.openMatches.startTime)).all();
    return Promise.all(rows.map(async (r) => {
      const count = db.select({ count: sql<number>`count(*)` }).from(schema.openMatchPlayers).where(eq(schema.openMatchPlayers.matchId, r.id)).get();
      return { ...matchRow(r), playerCount: count?.count ?? 0 };
    }));
  },
  async findById(id) {
    const r = db.select().from(schema.openMatches).where(eq(schema.openMatches.id, id)).get();
    if (!r) return null;
    const count = db.select({ count: sql<number>`count(*)` }).from(schema.openMatchPlayers).where(eq(schema.openMatchPlayers.matchId, id)).get();
    return { ...matchRow(r), playerCount: count?.count ?? 0 };
  },
  async create(input) {
    const id = uuid(); const now = new Date();
    db.insert(schema.openMatches).values({ id, clubId: input.clubId, courtId: input.courtId, creatorId: input.creatorId, title: input.title, startTime: input.startTime, endTime: input.endTime, duration: input.duration, minLevel: input.minLevel, maxLevel: input.maxLevel, maxPlayers: input.maxPlayers, status: "open", notes: input.notes, createdAt: now }).run();
    return matchRow(db.select().from(schema.openMatches).where(eq(schema.openMatches.id, id)).get()!);
  },
  async joinMatch(matchId, userId) {
    const id = uuid(); const now = new Date();
    db.insert(schema.openMatchPlayers).values({ id, matchId, userId, joinedAt: now }).run();
    const playerCount = db.select({ count: sql<number>`count(*)` }).from(schema.openMatchPlayers).where(eq(schema.openMatchPlayers.matchId, matchId)).get();
    const match = db.select().from(schema.openMatches).where(eq(schema.openMatches.id, matchId)).get();
    if (match && playerCount && playerCount.count >= match.maxPlayers) {
      db.update(schema.openMatches).set({ status: "full" }).where(eq(schema.openMatches.id, matchId)).run();
    }
    return playerRow(db.select().from(schema.openMatchPlayers).where(eq(schema.openMatchPlayers.id, id)).get()!);
  },
  async leaveMatch(matchId, userId) {
    db.delete(schema.openMatchPlayers).where(and(eq(schema.openMatchPlayers.matchId, matchId), eq(schema.openMatchPlayers.userId, userId))).run();
    db.update(schema.openMatches).set({ status: "open" }).where(and(eq(schema.openMatches.id, matchId), eq(schema.openMatches.status, "full"))).run();
  },
  async cancelMatch(matchId) {
    db.update(schema.openMatches).set({ status: "cancelled" }).where(eq(schema.openMatches.id, matchId)).run();
    return matchRow(db.select().from(schema.openMatches).where(eq(schema.openMatches.id, matchId)).get()!);
  },
  async getPlayers(matchId) {
    return db.select().from(schema.openMatchPlayers).where(eq(schema.openMatchPlayers.matchId, matchId)).all().map(playerRow);
  },
};
