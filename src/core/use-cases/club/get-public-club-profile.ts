import { resolveClubConfig, type ResolveClubConfigInput } from "./resolve-club-config";
import type { Club } from "@/core/entities/club";
import type { ClubConfig, IClubConfigPort } from "@/core/ports/club-config-port";
import type { IClubRepository } from "@/core/ports/club-repository";

export type PublicClubProfile = {
  readonly config: ClubConfig;
  readonly club: Club | null;
};

export type PublicClubProfilePorts = {
  readonly configPort: IClubConfigPort;
  readonly clubRepository: Pick<IClubRepository, "findById" | "findBySlug">;
};

export async function getPublicClubProfile(
  input: ResolveClubConfigInput,
  ports: PublicClubProfilePorts
): Promise<PublicClubProfile | null> {
  const config = await resolveClubConfig(input, ports.configPort);
  if (!config) {
    return null;
  }

  const club = config.clubId
    ? await ports.clubRepository.findById(config.clubId)
    : await ports.clubRepository.findBySlug(config.slug);

  return { config, club };
}
