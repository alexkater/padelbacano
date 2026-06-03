// ─── Partner post repository port ───────────────────────────────────────────

import type { PartnerPost } from "../entities/partner-post";

export interface IPartnerPostRepository {
  /** List active partner posts for a club */
  listActive(clubId: string): Promise<PartnerPost[]>;

  /** Create a new partner post */
  create(input: {
    clubId: string;
    userId: string;
    name: string;
    level: number;
    schedule: string;
    notes?: string;
  }): Promise<PartnerPost>;

  /** Deactivate a partner post (soft delete) */
  deactivate(id: string): Promise<PartnerPost>;
}
