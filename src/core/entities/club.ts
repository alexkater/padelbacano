// ─── Club entity ───────────────────────────────────────────────────────────
// Pure domain entity. No framework code, no ORM, no side-effects.

import type { Court } from "./court";

export type ClubTheme = {
  primaryColor: string; // hex, e.g. "#1a3a2a"
  surfaceColor: string;
  fontFamily: string; // Google Font name, e.g. "Saira"
  logoUrl: string | null;
  borderRadius: "none" | "sm" | "md" | "lg";
};

export type CancellationPolicy = {
  minHoursBefore: number; // minimum hours before booking to cancel free
  penaltyPercent: number; // 0-100, percentage of price kept on late cancel
  allowRefund: boolean;
};

export type ClubContact = {
  phone: string;
  email: string;
  whatsapp: string | null;
  address: string;
  googleMapsUrl: string | null;
};

export type ClubHero = {
  title: string;
  subtitle: string;
  description: string;
  heroImageUrl: string | null;
  photos: string[]; // gallery URLs
};

export type ClubContent = {
  hero: ClubHero;
  about: string; // markdown
  prices: string; // markdown
  openingHours: string; // markdown
};

export type ClubPricing = {
  memberPrice: number;
  nonMemberPrice: number;
  currency: string;
};

export type Club = {
  id: string;
  slug: string;
  name: string;
  theme: ClubTheme;
  pricing: ClubPricing;
  cancellationPolicy: CancellationPolicy;
  contact: ClubContact;
  content: ClubContent;
  courts: Court[];
  createdAt: Date;
  updatedAt: Date;
};
