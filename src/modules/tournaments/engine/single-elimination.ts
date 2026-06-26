// ─── Single-elimination tournament engine ─────────────────────────────────────
// Stateful bracket engine. Pure logic, no DB access.
// Supports 2–32 players with byes when count is not a power of 2.
// Standard tennis seeding. 3rd place match for 4+ players.

import type { Match, Bracket, TournamentStanding } from "@/core/ports/tournament-port";

// ─── Public types ─────────────────────────────────────────────────────────────

export type PlayerSeed = {
  id: string;
  name: string;
  seed?: number;
};

// ─── Internal types ──────────────────────────────────────────────────────────

type PlayerSlot = 1 | 2;

type InternalMatch = {
  id: string;
  tournamentId: string;
  round: number;
  player1Id: string | null;
  player2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  status: "pending" | "in_progress" | "completed";
  scheduledTime: Date | null;
  /** ID of the match the winner advances to (null for final) */
  nextMatchId: string | null;
  /** Which player slot (1 or 2) the winner takes in the next match */
  nextPlayerSlot: PlayerSlot | null;
  /** ID of the 3rd-place match the loser goes to (null if not applicable) */
  nextLoserMatchId: string | null;
  /** Which player slot (1 or 2) the loser takes in the 3rd-place match */
  nextLoserSlot: PlayerSlot | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextPowerOf2(n: number): number {
  if (n <= 0) return 1;
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/**
 * Standard tennis seeding order using the recursive snake algorithm.
 * Returns the seed number that should occupy each bracket position.
 *
 * For 8 players: [1, 8, 4, 5, 3, 6, 2, 7]
 * For 4 players: [1, 4, 3, 2]
 * For 2 players: [1, 2]
 *
 * This ensures the top seed is separated from the second seed until the final.
 */
function seedingOrder(size: number): number[] {
  if (size === 2) return [1, 2];
  if (size === 4) return [1, 4, 3, 2]; // base: ensures 1v4, 3v2
  // For larger brackets, top-half order is seedingOrder(size/2).
  // Each pair: [top_half_seed, size + 1 - top_half_seed]
  const half = seedingOrder(size / 2);
  const result: number[] = [];
  for (const s of half) {
    result.push(s);
    result.push(size + 1 - s);
  }
  return result;
}

/** Build a match ID like "r1m1", "r2m3" */
function matchId(round: number, index: number): string {
  return `r${round}m${index}`;
}

/** Count total completed matches for a player */
function playerMatchCounts(
  matches: Map<string, InternalMatch>,
  playerId: string,
): { matchesPlayed: number; wins: number; losses: number; furthestRound: number } {
  let matchesPlayed = 0;
  let wins = 0;
  let losses = 0;
  let furthestRound = 0;

  for (const m of matches.values()) {
    if (m.status !== "completed") continue;
    if (m.player1Id !== playerId && m.player2Id !== playerId) continue;

    // Count completed playable matches (ignore byes for matchesPlayed)
    const isBye = !m.player1Id || !m.player2Id;
    if (!isBye) {
      matchesPlayed++;
    }

    furthestRound = Math.max(furthestRound, m.round);

    if (m.winnerId === playerId) {
      wins++;
    } else if (m.player1Id === playerId || m.player2Id === playerId) {
      losses++;
    }
  }

  return { matchesPlayed, wins, losses, furthestRound };
}

/** Convert InternalMatch to the port Match type */
function toMatch(m: InternalMatch): Match {
  return {
    id: m.id,
    tournamentId: m.tournamentId,
    round: m.round,
    player1Id: m.player1Id,
    player2Id: m.player2Id,
    score1: m.score1,
    score2: m.score2,
    winnerId: m.winnerId,
    status: m.status,
    scheduledTime: m.scheduledTime,
  };
}

// ─── Engine ───────────────────────────────────────────────────────────────────

export class SingleEliminationEngine {
  private players: PlayerSeed[];
  private matches: Map<string, InternalMatch> = new Map();
  private roundMatchIds: string[][] = []; // 1-indexed, index 0 unused
  private bracketSize: number;
  private numRounds: number;

  constructor(players: PlayerSeed[]) {
    if (players.length < 2) {
      throw new Error(`Single elimination requires at least 2 players, got ${players.length}`);
    }
    if (players.length > 32) {
      throw new Error(`Single elimination supports at most 32 players, got ${players.length}`);
    }

    this.players = [...players];
    this.bracketSize = nextPowerOf2(players.length);
    this.numRounds = Math.log2(this.bracketSize);
  }

  // ─── generateBracket ──────────────────────────────────────────────────────────
  // Builds the full match tree from the player list. Byes are auto-completed.

  generateBracket(): Bracket {
    // Assign seeds: use provided seed or fall back to input order
    const sorted = this.players
      .map((p, i) => ({ ...p, seed: p.seed ?? i + 1 }))
      .sort((a, b) => a.seed! - b.seed!);

    const order = seedingOrder(this.bracketSize);

    // Place players into bracket positions using the seeding order.
    // order[i] = seed number that should occupy position i (0-indexed).
    const seedToPlayer = new Map<number, PlayerSeed>();
    for (const p of sorted) {
      seedToPlayer.set(p.seed!, p);
    }
    const bracketSlots: (PlayerSeed | null)[] = new Array(this.bracketSize).fill(null);
    for (let i = 0; i < order.length; i++) {
      bracketSlots[i] = seedToPlayer.get(order[i]) ?? null;
    }

    // Build rounds bottom-up: round 1 = first matches, final = last round
    let currentSlots: (string | null)[] = bracketSlots.map((p) => p?.id ?? null);
    let round = 1;

    this.roundMatchIds = [[]]; // pad index 0 for 1-based access

    while (currentSlots.length > 1) {
      const matchIds = this.createRound(round, currentSlots);
      this.roundMatchIds.push(matchIds);

      // Prepare next round slots (winners will fill these)
      currentSlots = new Array(currentSlots.length / 2).fill(null);
      round++;
    }

    // Create 3rd place match when there are enough players for meaningful semifinals
    if (this.players.length >= 4) {
      this.createThirdPlaceMatch();
    }

    // Auto-complete bye matches (matches where one side is null)
    this.autoCompleteByes();

    return this.toBracket();
  }

  // ─── advanceWinner ────────────────────────────────────────────────────────────
  // Records a winner for a match, advances them to the next round,
  // and sends the loser to the 3rd-place match if applicable.

  advanceWinner(matchId: string, winnerId: string): Match {
    const match = this.matches.get(matchId);
    if (!match) {
      throw new Error(`Match not found: ${matchId}`);
    }
    if (match.status === "completed") {
      throw new Error(`Match is already completed: ${matchId}`);
    }
    if (match.player1Id !== winnerId && match.player2Id !== winnerId) {
      throw new Error(
        `Winner ${winnerId} is not a participant in match ${matchId}`,
      );
    }

    const loserId =
      match.player1Id === winnerId ? match.player2Id : match.player1Id;

    // Update the current match
    match.winnerId = winnerId;
    match.status = "completed";

    // Advance winner to the next match
    if (match.nextMatchId && match.nextPlayerSlot) {
      const nextMatch = this.matches.get(match.nextMatchId);
      if (nextMatch) {
        if (match.nextPlayerSlot === 1) {
          nextMatch.player1Id = winnerId;
        } else {
          nextMatch.player2Id = winnerId;
        }
      }
    }

    // Send loser to the 3rd-place match if applicable
    if (loserId && match.nextLoserMatchId && match.nextLoserSlot) {
      const loserMatch = this.matches.get(match.nextLoserMatchId);
      if (loserMatch) {
        if (match.nextLoserSlot === 1) {
          loserMatch.player1Id = loserId;
        } else {
          loserMatch.player2Id = loserId;
        }
      }
    }

    return toMatch(match);
  }

  // ─── getStandings ─────────────────────────────────────────────────────────────
  // Rank: 1st = final winner, 2nd = final loser, 3rd = 3rd-place match winner.
  // Others sorted by furthest round reached, then wins, then seed.

  getStandings(): TournamentStanding[] {
    const playerMap = new Map<string, PlayerSeed>();
    for (const p of this.players) {
      playerMap.set(p.id, p);
    }

    const final = this.findFinal();
    const thirdPlace = this.thirdPlaceMatchId
      ? this.matches.get(this.thirdPlaceMatchId)
      : null;

    // Build standing entries
    const entries: TournamentStanding[] = [];

    for (const p of this.players) {
      const stats = playerMatchCounts(this.matches, p.id);
      const playerName = p.name;

      let points = 0;

      if (final?.winnerId === p.id) {
        points = 100;
      } else if (final && final.winnerId && (final.player1Id === p.id || final.player2Id === p.id)) {
        points = 60;
      } else if (thirdPlace?.winnerId === p.id) {
        points = 40;
      } else if (thirdPlace && (thirdPlace.player1Id === p.id || thirdPlace.player2Id === p.id)) {
        points = 20;
      } else {
        points = stats.furthestRound * 10 + stats.wins * 2;
      }

      entries.push({
        userId: p.id,
        playerName,
        matchesPlayed: stats.matchesPlayed,
        wins: stats.wins,
        losses: stats.losses,
        points,
      });
    }

    // Sort: position ascending, then furthest round, then wins, then seed
    const seedMap = new Map(this.players.map((p, i) => [p.id, p.seed ?? i + 1]));

    entries.sort((a, b) => {
      // By points descending (higher = better placement)
      if (a.points !== b.points) return b.points - a.points;

      // Tiebreaker: furthest round reached
      const aStats = playerMatchCounts(this.matches, a.userId);
      const bStats = playerMatchCounts(this.matches, b.userId);
      if (aStats.furthestRound !== bStats.furthestRound) {
        return bStats.furthestRound - aStats.furthestRound;
      }

      // Tiebreaker: wins
      if (a.wins !== b.wins) return b.wins - a.wins;

      // Tiebreaker: seed (lower = better)
      return (seedMap.get(a.userId) ?? 999) - (seedMap.get(b.userId) ?? 999);
    });

    return entries;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────────

  /** Create all matches for a given round from player/bye slots */
  private createRound(round: number, playerSlots: (string | null)[]): string[] {
    const matchIds: string[] = [];
    const numMatches = playerSlots.length / 2;

    for (let i = 0; i < numMatches; i++) {
      const p1: string | null = playerSlots[i * 2];
      const p2: string | null = playerSlots[i * 2 + 1];
      const id = matchId(round, i + 1);

      // Wire up to next round: two matches feed into one
      const nextRound = round + 1;
      const nextMatchIndex = Math.floor(i / 2);
      const nextSlot: PlayerSlot = i % 2 === 0 ? 1 : 2;

      const match: InternalMatch = {
        id,
        tournamentId: "",
        round,
        player1Id: p1,
        player2Id: p2,
        score1: null,
        score2: null,
        winnerId: null,
        status: "pending",
        scheduledTime: null,
        nextMatchId:
          nextRound <= this.numRounds
            ? matchId(nextRound, nextMatchIndex + 1)
            : null,
        nextPlayerSlot:
          nextRound <= this.numRounds ? nextSlot : null,
        nextLoserMatchId: null,
        nextLoserSlot: null,
      };

      this.matches.set(id, match);
      matchIds.push(id);
    }

    return matchIds;
  }

  /** Create the 3rd-place match and wire semifinal losers into it */
  private createThirdPlaceMatch(): void {
    const semiRound = this.numRounds - 1;
    if (semiRound < 1) return;

    const semiMatchIds = this.roundMatchIds[semiRound];
    if (!semiMatchIds || semiMatchIds.length < 2) return;

    const finalRoundMatchIds = this.roundMatchIds[this.numRounds] ?? [];
    const id = matchId(this.numRounds, finalRoundMatchIds.length + 1);
    this.thirdPlaceMatchId = id;

    const match: InternalMatch = {
      id,
      tournamentId: "",
      round: this.numRounds,
      player1Id: null,
      player2Id: null,
      score1: null,
      score2: null,
      winnerId: null,
      status: "pending",
      scheduledTime: null,
      nextMatchId: null,
      nextPlayerSlot: null,
      nextLoserMatchId: null,
      nextLoserSlot: null,
    };

    this.matches.set(id, match);

    // Wire each semifinal loser into the 3rd-place match
    for (let i = 0; i < semiMatchIds.length; i++) {
      const semiMatch = this.matches.get(semiMatchIds[i]);
      if (semiMatch) {
        semiMatch.nextLoserMatchId = id;
        semiMatch.nextLoserSlot = (i + 1) as PlayerSlot;
      }
    }
  }

  /**
   * Auto-complete first-round byes (player vs empty slot).
   * Advances winners to round 2. Does NOT cascade beyond round 1 —
   * later rounds with one player + one null stay pending (the null
   * represents an unplayed match, not a bye).
   */
  private autoCompleteByes(): void {
    const round1Ids = this.roundMatchIds[1] ?? [];

    for (const id of round1Ids) {
      const match = this.matches.get(id);
      if (!match || match.status !== "pending") continue;

      const p1 = match.player1Id;
      const p2 = match.player2Id;

      if (p1 && !p2) {
        match.winnerId = p1;
        match.status = "completed";
        this.advanceToNextMatch(match, p1);
      } else if (!p1 && p2) {
        match.winnerId = p2;
        match.status = "completed";
        this.advanceToNextMatch(match, p2);
      }
    }
  }

  /** Set a player into the next match slot */
  private advanceToNextMatch(match: InternalMatch, playerId: string): void {
    if (!match.nextMatchId || !match.nextPlayerSlot) return;
    const next = this.matches.get(match.nextMatchId);
    if (!next) return;
    if (match.nextPlayerSlot === 1) {
      next.player1Id = playerId;
    } else {
      next.player2Id = playerId;
    }
  }

  /** Find the final match (last round, single match unless 3rd-place also there) */
  private findFinal(): InternalMatch | null {
    const finalRound = this.numRounds;
    const finalRoundIds = this.roundMatchIds[finalRound] ?? [];

    // The final is the first match listed in the final round
    // (the 3rd-place match is added after)
    for (const id of finalRoundIds) {
      const match = this.matches.get(id);
      if (match && match.id !== this.thirdPlaceMatchId) {
        return match;
      }
    }

    // Fallback: look for the match with no nextMatchId that's not the 3rd-place
    for (const match of this.matches.values()) {
      if (match.id === this.thirdPlaceMatchId) continue;
      if (match.nextMatchId === null && match.round === this.numRounds) {
        return match;
      }
    }

    return null;
  }

  private thirdPlaceMatchId: string | null = null;

  /**
   * Get the current bracket state without regenerating it.
   * Use after advanceWinner() to see updated match data.
   */
  getBracket(): Bracket {
    return this.toBracket();
  }

  /** Convert internal state to port Bracket type */
  private toBracket(): Bracket {
    const roundsMap = new Map<number, Match[]>();

    for (const match of this.matches.values()) {
      const existing = roundsMap.get(match.round) ?? [];
      existing.push(toMatch(match));
      roundsMap.set(match.round, existing);
    }

    const rounds = Array.from(roundsMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, matches]) => ({ matches }));

    return {
      rounds,
      byeCount: this.bracketSize - this.players.length,
    };
  }
}
