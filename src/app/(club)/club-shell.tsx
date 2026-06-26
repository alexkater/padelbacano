import Image from "next/image";
import Link from "next/link";
import { MapPin, Mail, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClubTenantProvider } from "@/components/club/club-tenant-provider";
import type { PublicClubProfileView } from "@/infra/tenant/public-club-profile-service";
import type { CSSProperties, ReactNode } from "react";

type ClubThemeVars = CSSProperties & {
  readonly [key: `--club-${string}`]: string;
  readonly [key: `--font-${string}`]: string;
};

const RADIUS = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
} as const;

function cssString(value: string): string {
  return value.replaceAll('"', "");
}

function clubThemeVars(profile: PublicClubProfileView): ClubThemeVars {
  const { theme } = profile.config;
  const radius = RADIUS[theme.borderRadius];
  const surface = theme.surfaceColor;
  const primary = theme.primaryColor;

  return {
    "--club-primary": primary,
    "--club-primary-hover": `color-mix(in srgb, ${primary} 82%, black)`,
    "--club-primary-foreground": "#ffffff",
    "--club-surface": surface,
    "--club-surface-alt": `color-mix(in srgb, ${surface} 92%, white)`,
    "--club-border": `color-mix(in srgb, ${surface} 78%, black)`,
    "--club-ink": "#1a1a1a",
    "--club-ink-muted": "#5a5a5a",
    "--club-radius": radius,
    "--club-radius-sm": RADIUS[theme.borderRadius === "none" ? "sm" : theme.borderRadius],
    "--club-radius-lg": RADIUS[theme.borderRadius === "lg" ? "md" : theme.borderRadius === "md" ? "lg" : "md"],
    "--club-radius-xl": "1rem",
    "--club-danger": "#dc2626",
    "--club-danger-hover": "#b91c1c",
    "--club-danger-bg": "#fef2f2",
    "--club-warning": "#d97706",
    "--club-warning-bg": "#fffbeb",
    "--club-success": primary,
    "--club-success-bg": `color-mix(in srgb, ${primary} 8%, white)`,
    "--font-club-sans": `"${cssString(theme.fontFamily)}", var(--font-pb-sans, ui-sans-serif, system-ui, sans-serif)`,
    fontFamily: "var(--font-club-sans)",
  };
}

function logoUrl(profile: PublicClubProfileView): string {
  return profile.config.contact.logoUrl ?? profile.config.theme.logoUrl ?? profile.club?.theme.logoUrl ?? "/logo.png";
}

function address(profile: PublicClubProfileView): string {
  return profile.club?.contact.address ?? profile.config.city;
}

function openingHours(profile: PublicClubProfileView): string {
  return profile.club?.content.openingHours ?? "Consulta horarios y disponibilidad antes de reservar.";
}

export function ClubShell({
  children,
  profile,
}: {
  readonly children: ReactNode;
  readonly profile: PublicClubProfileView;
}) {
  const clubId = profile.config.clubId ?? profile.club?.id ?? null;
  const homeHref = profile.source === "database" ? `/${profile.config.slug}` : "/clubes";

  return (
    <ClubTenantProvider
      tenant={{
        slug: profile.config.slug,
        name: profile.config.name,
        city: profile.config.city,
        modules: profile.config.modules,
        clubId,
      }}
    >
      <div className="flex min-h-[100dvh] flex-col bg-[var(--club-surface)] text-[var(--club-ink)]" style={clubThemeVars(profile)}>
        <header className="sticky top-0 z-40 border-b border-[var(--club-border)] bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href={homeHref} className="flex min-h-11 items-center gap-3 rounded-[var(--club-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-primary)]">
              <Image src={logoUrl(profile)} alt={profile.config.name} width={160} height={40} className="h-10 w-auto" priority />
              <span className="hidden text-sm font-bold text-[var(--club-ink)] sm:inline">{profile.config.name}</span>
            </Link>

            <nav aria-label="Navegación del club" className="hidden items-center gap-6 md:flex">
              <Link href={homeHref} className="text-sm text-[var(--club-ink-muted)] transition-colors hover:text-[var(--club-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-primary)]">Club</Link>
              <Link href="/reservar" className="text-sm text-[var(--club-ink-muted)] transition-colors hover:text-[var(--club-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-primary)]">Reservar</Link>
              <Link href="/torneos" className="text-sm text-[var(--club-ink-muted)] transition-colors hover:text-[var(--club-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-primary)]">Torneos</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/perfil" className="hidden text-sm text-[var(--club-ink-muted)] hover:text-[var(--club-ink)] md:block">Perfil</Link>
              <Link href={clubId ? `/reservar?clubId=${clubId}` : "/reservar"}>
                <Button size="lg">Pistas</Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-[var(--club-border)] bg-[var(--club-surface-alt)]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-3">
            <div>
              <Image src={logoUrl(profile)} alt={profile.config.name} width={160} height={48} className="mb-3 h-12 w-auto opacity-85" />
              <p className="text-sm text-[var(--club-ink-muted)]">{profile.club?.content.hero.description ?? `${profile.config.name} en ${profile.config.city}.`}</p>
              {profile.config.verified ? (
                <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--club-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--club-primary)]">
                  <ShieldCheck aria-hidden="true" className="size-4" /> Club verificado
                </p>
              ) : null}
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-[var(--club-ink)]">Contacto</h4>
              <div className="space-y-2 text-sm text-[var(--club-ink-muted)]">
                {profile.config.contact.phone ? <p className="flex gap-2"><Phone aria-hidden="true" className="size-4" />{profile.config.contact.phone}</p> : null}
                {profile.config.contact.email ? <p className="flex gap-2"><Mail aria-hidden="true" className="size-4" />{profile.config.contact.email}</p> : null}
                <p className="flex gap-2"><MapPin aria-hidden="true" className="size-4" />{address(profile)}</p>
              </div>
            </div>
            <div>
              <h4 className="mb-3 font-semibold text-[var(--club-ink)]">Horario</h4>
              <p className="text-sm text-[var(--club-ink-muted)]">{openingHours(profile)}</p>
            </div>
          </div>
          <div className="border-t border-[var(--club-border)] py-4 text-center text-xs text-[var(--club-ink-muted)]">
            © {new Date().getFullYear()} {profile.config.name} — Powered by PádelBacano
          </div>
        </footer>
      </div>
    </ClubTenantProvider>
  );
}
