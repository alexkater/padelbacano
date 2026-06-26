import type { ClubConfig, IClubConfigPort } from "@/core/ports/club-config-port";

export type ResolveClubConfigInput = {
  readonly slug?: string | null;
  readonly clubId?: string | null;
  readonly host?: string | null;
};

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0] ?? host.trim().toLowerCase();
}

export async function resolveClubConfig(
  input: ResolveClubConfigInput,
  configPort: IClubConfigPort
): Promise<ClubConfig | null> {
  const slug = input.slug?.trim();
  if (slug) {
    return configPort.getBySlug(slug);
  }

  const clubId = input.clubId?.trim();
  if (clubId) {
    return configPort.getById(clubId);
  }

  const host = input.host ? normalizeHost(input.host) : null;
  if (!host) {
    return null;
  }

  const activeConfigs = await configPort.listActive();
  return activeConfigs.find((config) => config.contact.domain === host) ?? null;
}
