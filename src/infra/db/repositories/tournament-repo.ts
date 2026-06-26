import { eq, and, asc, desc, sql } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { ITournamentRepository } from "@/core/ports/tournament-repository";
import type { Tournament, TournamentRegistration, TournamentMatch, TournamentStatus } from "@/core/entities/tournament";

function tRow(r: typeof schema.tournaments.$inferSelect): Tournament { return { ...r, createdAt: r.createdAt, updatedAt: r.updatedAt, registrationCount: undefined }; }
function regRow(r: typeof schema.tournamentRegistrations.$inferSelect): TournamentRegistration { return { ...r, registeredAt: r.registeredAt }; }
function matchRow(r: typeof schema.tournamentMatches.$inferSelect): TournamentMatch { return { ...r, createdAt: r.createdAt }; }

export const tournamentRepo: ITournamentRepository = {
  async listByClub(clubId) {
    const rows = db.select().from(schema.tournaments).where(eq(schema.tournaments.clubId, clubId)).orderBy(desc(schema.tournaments.startDate)).all();
    return Promise.all(rows.map(async r => {
      const count = db.select({ count: sql<number>`count(*)` }).from(schema.tournamentRegistrations).where(eq(schema.tournamentRegistrations.tournamentId, r.id)).get();
      return { ...tRow(r), registrationCount: count?.count ?? 0 };
    }));
  },
  async findById(id) {
    const r = db.select().from(schema.tournaments).where(eq(schema.tournaments.id, id)).get();
    if (!r) return null;
    const count = db.select({ count: sql<number>`count(*)` }).from(schema.tournamentRegistrations).where(eq(schema.tournamentRegistrations.tournamentId, id)).get();
    return { ...tRow(r), registrationCount: count?.count ?? 0 };
  },
  async create(input) {
    const id = uuid(); const now = new Date();
    db.insert(schema.tournaments).values({ id, clubId: input.clubId, name: input.name, description: input.description, format: input.format, startDate: input.startDate, endDate: input.endDate ?? null, registrationDeadline: input.registrationDeadline ?? null, minLevel: input.minLevel ?? null, maxLevel: input.maxLevel ?? null, maxParticipants: input.maxParticipants ?? null,       level: input.level ?? "open", entryFee: input.entryFee ?? null, prize: input.prize ?? null, status: "draft", rules: input.rules ?? null, createdAt: now, updatedAt: now }).run();
    return tRow(db.select().from(schema.tournaments).where(eq(schema.tournaments.id, id)).get()!);
  },
  async update(id, input) {
    const now = new Date();
    db.update(schema.tournaments).set({ ...input, updatedAt: now } as any).where(eq(schema.tournaments.id, id)).run();
    return tRow(db.select().from(schema.tournaments).where(eq(schema.tournaments.id, id)).get()!);
  },
  async updateStatus(id, status) { const now = new Date(); db.update(schema.tournaments).set({ status, updatedAt: now }).where(eq(schema.tournaments.id, id)).run(); return tRow(db.select().from(schema.tournaments).where(eq(schema.tournaments.id, id)).get()!); },
  async register(tournamentId, userId) {
    const id = uuid(); const now = new Date();
    db.insert(schema.tournamentRegistrations).values({ id, tournamentId, userId, status: "pending", paymentStatus: "unpaid", registeredAt: now }).run();
    return regRow(db.select().from(schema.tournamentRegistrations).where(eq(schema.tournamentRegistrations.id, id)).get()!);
  },
  async unregister(registrationId) { db.update(schema.tournamentRegistrations).set({ status: "cancelled" }).where(eq(schema.tournamentRegistrations.id, registrationId)).run(); },
  async getRegistrations(tournamentId) { return db.select().from(schema.tournamentRegistrations).where(eq(schema.tournamentRegistrations.tournamentId, tournamentId)).all().map(regRow); },
  async createMatch(input) { const id = uuid(); const now = new Date(); db.insert(schema.tournamentMatches).values({ id, ...input, createdAt: now }).run(); return matchRow(db.select().from(schema.tournamentMatches).where(eq(schema.tournamentMatches.id, id)).get()!); },
  async updateMatchResult(matchId, score1, score2, winnerId) { db.update(schema.tournamentMatches).set({ score1, score2, winnerId, status: "completed" }).where(eq(schema.tournamentMatches.id, matchId)).run(); return matchRow(db.select().from(schema.tournamentMatches).where(eq(schema.tournamentMatches.id, matchId)).get()!); },
  async updateMatchPlayers(matchId, player1Id, player2Id) { db.update(schema.tournamentMatches).set({ player1Id, player2Id }).where(eq(schema.tournamentMatches.id, matchId)).run(); return matchRow(db.select().from(schema.tournamentMatches).where(eq(schema.tournamentMatches.id, matchId)).get()!); },
  async listMatches(tournamentId) { return db.select().from(schema.tournamentMatches).where(eq(schema.tournamentMatches.tournamentId, tournamentId)).orderBy(asc(schema.tournamentMatches.round), asc(schema.tournamentMatches.createdAt)).all().map(matchRow); },
};
