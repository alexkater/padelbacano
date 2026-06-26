import { CLUB_CONFIG, MODULE_FLAGS, THEME } from "@/padelbacano.config";
import { getPublicClubProfile } from "@/core/use-cases/club";
import { clubConfigRepo, clubRepo } from "@/infra/db/repositories";
import type { Club } from "@/core/entities/club";
import type { ClubConfig } from "@/core/ports/club-config-port";

export type PublicClubProfileSource = "database" | "bootstrap_fallback";

export type PublicClubProfileView = {
  readonly source: PublicClubProfileSource;
  readonly config: ClubConfig;
  readonly club: Club | null;
};

export type PublicClubProfileRequest = {
  readonly slug?: string | null;
  readonly headers?: Headers;
};

function requestHost(headers: Headers | undefined): string | null {
  return headers?.get("x-forwarded-host") ?? headers?.get("host") ?? null;
}

function requestedSlug(input: PublicClubProfileRequest): string | null {
  return input.slug ?? input.headers?.get("x-club-slug") ?? null;
}

function bootstrapConfig(): ClubConfig {
  return {
    id: "bootstrap-fallback",
    clubId: null,
    slug: CLUB_CONFIG.slug,
    name: CLUB_CONFIG.name,
    city: CLUB_CONFIG.location,
    department: CLUB_CONFIG.location,
    status: "active",
    verified: false,
    theme: {
      primaryColor: THEME.primaryColor,
      surfaceColor: THEME.surfaceColor,
      fontFamily: THEME.fontFamily,
      logoUrl: THEME.logoUrl,
      borderRadius: THEME.borderRadius,
    },
    pricing: {
      currency: "COP",
      peakPriceInCents: 120_000_00,
      offPeakPriceInCents: 90_000_00,
      memberDiscountPercent: 0,
    },
    modules: MODULE_FLAGS,
    cancellationPolicy: {
      minHoursBefore: 24,
      penaltyPercent: 0,
      allowRefund: true,
      summary: "Cancelación gratuita hasta 24 horas antes de la reserva.",
    },
    contact: {
      nit: null,
      phone: null,
      email: CLUB_CONFIG.fromEmail,
      domain: CLUB_CONFIG.domain,
      logoUrl: THEME.logoUrl,
      heroImageUrl: THEME.heroImageUrl,
    },
    createdAt: new Date(0),
  };
}

export async function resolvePublicClubProfile(
  input: PublicClubProfileRequest
): Promise<PublicClubProfileView> {
  const slug = requestedSlug(input);
  const profile = await getPublicClubProfile(
    { slug, host: requestHost(input.headers) },
    { configPort: clubConfigRepo, clubRepository: clubRepo }
  );

  if (profile) {
    return { ...profile, source: "database" };
  }

  const fallbackClub = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  return {
    source: "bootstrap_fallback",
    config: bootstrapConfig(),
    club: fallbackClub,
  };
}

export type PublicClubSummary = {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly city: string;
  readonly courtCount: number;
};

export async function listPublicClubSummaries(city: string | null): Promise<PublicClubSummary[]> {
  const configs = await clubConfigRepo.listActive();
  const normalizedCity = city?.trim().toLowerCase() ?? null;
  const filtered = normalizedCity
    ? configs.filter((config) => config.city.toLowerCase().includes(normalizedCity))
    : configs;

  return Promise.all(
    filtered.map(async (config) => {
      const club = config.clubId ? await clubRepo.findById(config.clubId) : null;
      return {
        id: config.clubId ?? config.id,
        slug: config.slug,
        name: config.name,
        city: config.city,
        courtCount: club?.courts.length ?? 0,
      };
    })
  );
}
