// ─── Court entity ──────────────────────────────────────────────────────────

export const COURT_TYPES = ["glass", "panoramic", "wall"] as const;
export type CourtType = (typeof COURT_TYPES)[number];

export type Court = {
  id: string;
  clubId: string;
  name: string; // e.g. "Court 1", "Central"
  courtType: CourtType;
  indoor: boolean;
  isActive: boolean;
  order: number; // display order
  createdAt: Date;
};
