// ─── Tenant context — request-scoped club resolution and isolation ────────

import { clubConfigRepo } from "@/infra/db/repositories/club-config-repo";
import { userRepo } from "@/infra/db/repositories/user-repo";
import { resolveClubConfig } from "@/core/use-cases/club";
import type { ClubConfig, IClubConfigPort } from "@/core/ports/club-config-port";

export type TenantRole = "player" | "club_admin" | "platform_admin";

export interface TenantContextInput {
  readonly slug?: string;
  readonly clubId?: string;
  readonly headers?: Headers;
  readonly userId?: string;
  readonly role?: TenantRole;
}

export class TenantResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantResolutionError";
  }
}

export class TenantAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantAccessError";
  }
}

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().split(":")[0] ?? host.trim().toLowerCase();
}

function getHost(headers: Headers | undefined): string | null {
  const rawHost = headers?.get("x-forwarded-host") ?? headers?.get("host");
  return rawHost ? normalizeHost(rawHost) : null;
}

export class TenantContext {
  private readonly input: TenantContextInput;
  private readonly configPort: IClubConfigPort;

  constructor(input: TenantContextInput, configPort: IClubConfigPort = clubConfigRepo) {
    this.input = input;
    this.configPort = configPort;
  }

  static fromRequest(input: TenantContextInput): TenantContext {
    return new TenantContext(input);
  }

  async resolveClub(): Promise<ClubConfig | null> {
    return resolveClubConfig(
      {
        slug: this.input.slug,
        clubId: this.input.clubId,
        host: getHost(this.input.headers),
      },
      this.configPort
    );
  }

  async requireClub(): Promise<ClubConfig> {
    const club = await this.resolveClub();
    if (!club) {
      throw new TenantResolutionError("No club config matched this request");
    }

    return club;
  }

  async requireClubAccess(clubId: string): Promise<void> {
    if (this.input.role === "platform_admin") {
      return;
    }

    if (!this.input.userId) {
      throw new TenantAccessError("Authenticated user required for club access");
    }

    if (this.input.role !== "club_admin") {
      throw new TenantAccessError("Club administrator role required");
    }

    const requestedClub = await this.resolveClub();
    if (requestedClub && requestedClub.id !== clubId && requestedClub.clubId !== clubId) {
      throw new TenantAccessError("Request tenant does not match target club");
    }

    const profile = await userRepo.getProfile(this.input.userId, clubId);
    if (profile?.role !== "admin") {
      throw new TenantAccessError("User is not an administrator for this club");
    }
  }
}
