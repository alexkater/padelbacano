// ─── Announcement entity ────────────────────────────────────────────────────

export const ANNOUNCEMENT_TYPES = ["general", "torneo", "escuela"] as const;
export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

export type Announcement = {
  id: string;
  clubId: string;
  title: string;
  content: string;
  type: AnnouncementType;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
};
