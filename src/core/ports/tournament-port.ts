// ─── Tournament port ────────────────────────────────────────────────────────
// Port interface for tournament operations. Bracket engine and API routes
// are out of scope — this is the contract layer only.

import type { TournamentFormat, TournamentStatus } from "../entities/tournament";

// ─── Domain types ───────────────────────────────────────────────────────────

export type { TournamentFormat, TournamentStatus };

export type Tournament = {
  id: string;
  clubId: string;
  name: string;
  format: TournamentFormat;
  startDate: Date;
  maxParticipants: number | null;
  level: "open" | "A" | "B" | "C";
  prize: string | null;
  status: TournamentStatus;
  players: string[];
  matches: string[];
};

export type Match = {
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
};

export type Bracket = {
  rounds: { matches: Match[] }[];
  byeCount: number;
};

export type TournamentStanding = {
  userId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number;
};

// ─── Port ───────────────────────────────────────────────────────────────────

export interface ITournamentPort {
  createTournament(
    data: Omit<Tournament, "id" | "players" | "matches" | "status">
  ): Promise<Tournament>;

  registerPlayer(tournamentId: string, userId: string): Promise<void>;

  getBracket(tournamentId: string): Promise<Bracket>;

  recordScore(
    matchId: string,
    scores: { score1: number; score2: number }
  ): Promise<Match>;

  getStandings(tournamentId: string): Promise<TournamentStanding[]>;

  listTournaments(
    clubId: string,
    filter?: { status?: TournamentStatus; format?: TournamentFormat }
  ): Promise<Tournament[]>;
}
