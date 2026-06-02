// ─── Club repository port ──────────────────────────────────────────────────
// Defines WHAT the core needs, not HOW it's implemented.

import type { Club, ClubTheme, ClubContent } from "../entities/club";

export interface IClubRepository {
  /** Get club by its URL slug (e.g. "el-remate") */
  findBySlug(slug: string): Promise<Club | null>;

  /** Get club by ID */
  findById(id: string): Promise<Club | null>;

  /** List all clubs (admin overview) */
  listAll(): Promise<Club[]>;

  /** Create a new club */
  create(club: Omit<Club, "id" | "createdAt" | "updatedAt" | "courts">): Promise<Club>;

  /** Update club theme settings */
  updateTheme(clubId: string, theme: Partial<ClubTheme>): Promise<Club>;

  /** Update club content (hero, about, prices, hours) */
  updateContent(clubId: string, content: Partial<ClubContent>): Promise<Club>;
}
