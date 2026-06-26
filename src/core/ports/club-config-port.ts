// ─── Club config port — DB-backed marketplace tenant config ────────────────
//
// Marketplace runtime configuration is sourced from club_configs.
// padelbacano.config.ts remains a bootstrap/fallback file only.
// Monetary values are integer cents. Never floats.

export const CLUB_CONFIG_STATUSES = [
  "pending_approval",
  "active",
  "suspended",
] as const;

export type ClubConfigStatus = (typeof CLUB_CONFIG_STATUSES)[number];

export interface ClubConfigTheme {
  readonly primaryColor: string;
  readonly surfaceColor: string;
  readonly fontFamily: string;
  readonly logoUrl: string | null;
  readonly borderRadius: "none" | "sm" | "md" | "lg";
}

export interface ClubConfigPricing {
  readonly currency: "COP";
  readonly peakPriceInCents: number;
  readonly offPeakPriceInCents: number;
  readonly memberDiscountPercent: number;
}

export interface ClubConfigModules {
  readonly social: boolean;
  readonly payments: boolean;
  readonly tournaments: boolean;
  readonly analytics: boolean;
  readonly invoicing: boolean;
  readonly school: boolean;
  readonly loyalty: boolean;
}

export interface ClubConfigCancellationPolicy {
  readonly minHoursBefore: number;
  readonly penaltyPercent: number;
  readonly allowRefund: boolean;
  readonly summary: string;
}

export interface ClubConfigContact {
  readonly nit: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly domain: string | null;
  readonly logoUrl: string | null;
  readonly heroImageUrl: string | null;
}

export interface ClubConfig {
  readonly id: string;
  readonly clubId: string | null;
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly department: string;
  readonly status: ClubConfigStatus;
  readonly verified: boolean;
  readonly theme: ClubConfigTheme;
  readonly pricing: ClubConfigPricing;
  readonly modules: ClubConfigModules;
  readonly cancellationPolicy: ClubConfigCancellationPolicy;
  readonly contact: ClubConfigContact;
  readonly createdAt: Date;
}

export type CreateClubConfigData = Omit<ClubConfig, "id" | "createdAt">;

export type UpdateClubConfigData = Partial<
  Omit<ClubConfig, "id" | "clubId" | "createdAt">
> & {
  readonly clubId?: string | null;
};

export interface IClubConfigPort {
  getBySlug(slug: string): Promise<ClubConfig | null>;
  getById(id: string): Promise<ClubConfig | null>;
  listActive(): Promise<ClubConfig[]>;
  create(data: CreateClubConfigData): Promise<ClubConfig>;
  update(id: string, data: UpdateClubConfigData): Promise<ClubConfig>;
  updateStatus(id: string, status: ClubConfigStatus): Promise<ClubConfig>;
}
