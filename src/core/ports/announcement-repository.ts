// ─── Announcement repository port ───────────────────────────────────────────

import type { Announcement, AnnouncementType } from "../entities/announcement";

export interface IAnnouncementRepository {
  /** List published announcements for a club (public-facing) */
  listPublished(clubId: string): Promise<Announcement[]>;

  /** List all announcements for a club (admin) */
  listAll(clubId: string): Promise<Announcement[]>;

  /** Get a single announcement by ID */
  findById(id: string): Promise<Announcement | null>;

  /** Create a new announcement */
  create(input: {
    clubId: string;
    title: string;
    content: string;
    type: AnnouncementType;
  }): Promise<Announcement>;

  /** Update an announcement */
  update(id: string, input: {
    title?: string;
    content?: string;
    type?: AnnouncementType;
    isPublished?: boolean;
  }): Promise<Announcement>;

  /** Delete an announcement */
  delete(id: string): Promise<void>;
}
