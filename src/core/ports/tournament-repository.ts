import type { Tournament, TournamentRegistration, TournamentMatch, TournamentStatus } from "../entities/tournament";

export interface ITournamentRepository {
  listByClub(clubId: string): Promise<Tournament[]>;
  findById(id: string): Promise<Tournament | null>;
  create(input: Omit<Tournament, "id" | "createdAt" | "updatedAt" | "registrationCount">): Promise<Tournament>;
  update(id: string, input: Partial<Tournament>): Promise<Tournament>;
  updateStatus(id: string, status: TournamentStatus): Promise<Tournament>;
  register(tournamentId: string, userId: string): Promise<TournamentRegistration>;
  unregister(registrationId: string): Promise<void>;
  getRegistrations(tournamentId: string): Promise<TournamentRegistration[]>;
  createMatch(input: Omit<TournamentMatch, "id" | "createdAt">): Promise<TournamentMatch>;
  updateMatchResult(matchId: string, score1: number, score2: number, winnerId: string): Promise<TournamentMatch>;
  updateMatchPlayers(matchId: string, player1Id: string | null, player2Id: string | null): Promise<TournamentMatch>;
  listMatches(tournamentId: string): Promise<TournamentMatch[]>;
}
