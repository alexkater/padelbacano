import type { OpenMatch, OpenMatchPlayer } from "../entities/open-match";

export interface IOpenMatchRepository {
  listOpen(clubId: string): Promise<OpenMatch[]>;
  findById(id: string): Promise<OpenMatch | null>;
  create(input: Omit<OpenMatch, "id" | "createdAt" | "playerCount">): Promise<OpenMatch>;
  joinMatch(matchId: string, userId: string): Promise<OpenMatchPlayer>;
  leaveMatch(matchId: string, userId: string): Promise<void>;
  cancelMatch(matchId: string): Promise<OpenMatch>;
  getPlayers(matchId: string): Promise<OpenMatchPlayer[]>;
}
