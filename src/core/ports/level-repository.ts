import type { PlayerLevel } from "../entities/level";

export interface ILevelRepository {
  getLevel(userId: string, clubId: string): Promise<PlayerLevel | null>;
  upsertLevel(input: Omit<PlayerLevel, "id" | "updatedAt">): Promise<PlayerLevel>;
  updateRating(userId: string, clubId: string, won: boolean): Promise<PlayerLevel>;
  listByClub(clubId: string): Promise<PlayerLevel[]>;
}
