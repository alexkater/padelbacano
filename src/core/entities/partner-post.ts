// ─── Partner post entity (tablón "Busco Compañero") ─────────────────────────

export type PartnerPost = {
  id: string;
  clubId: string;
  userId: string;
  name: string;
  level: number; // 1-7
  schedule: string;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
};
