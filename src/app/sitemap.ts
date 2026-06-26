import type { MetadataRoute } from "next";
import { clubConfigRepo } from "@/infra/db/repositories";

const BASE_URL = "https://padelbacano.com";

/** Static routes that always exist in the app. */
const STATIC_ROUTES = [
  { path: "/buscar", priority: 1.0, changeFrequency: "daily" as const },
  { path: "/buscar/resultados", priority: 0.8, changeFrequency: "hourly" as const },
  { path: "/clubes", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/onboarding", priority: 0.5, changeFrequency: "monthly" as const },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // -- Static routes --
  for (const route of STATIC_ROUTES) {
    entries.push({
      url: `${BASE_URL}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  // -- Marketplace club pages --
  const clubConfigs = await clubConfigRepo.listActive();

  for (const config of clubConfigs) {
    const slug = config.slug;
    const lastMod = config.createdAt;

    // Marketplace club detail
    entries.push({
      url: `${BASE_URL}/clubes/${slug}`,
      lastModified: lastMod,
      changeFrequency: "daily",
      priority: 0.8,
    });

    // Club public profile (under slug root)
    entries.push({
      url: `${BASE_URL}/${slug}`,
      lastModified: lastMod,
      changeFrequency: "daily",
      priority: 0.9,
    });
  }

  // -- Tournament pages --
  // For each active club, list tournaments
  for (const config of clubConfigs) {
    if (!config.clubId) continue;
    if (!config.modules.tournaments) continue;

    try {
      const { tournamentRepo } = await import("@/infra/db/repositories");
      const tournaments = await tournamentRepo.listByClub(config.clubId);

      for (const tournament of tournaments) {
        if (tournament.status === "draft" || tournament.status === "cancelled") continue;

        entries.push({
          url: `${BASE_URL}/torneos/${tournament.id}`,
          lastModified: tournament.updatedAt,
          changeFrequency: "daily",
          priority: 0.7,
        });
      }
    } catch {
      // Skip club if tournament listing fails
    }
  }

  return entries;
}
