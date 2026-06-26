import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ShieldCheck } from "lucide-react";
import { resolvePublicClubProfile } from "@/infra/tenant/public-club-profile-service";

type PageProps = {
  readonly params: Promise<{ readonly slug: string }>;
};

function formatCop(cents: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function PublicClubProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await resolvePublicClubProfile({ slug, headers: await headers() });
  const hero = profile.club?.content.hero;
  const courts = profile.club?.courts ?? [];
  const clubId = profile.config.clubId ?? profile.club?.id ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="overflow-hidden rounded-[var(--club-radius-xl)] border border-[var(--club-border)] bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--club-primary)]">Club oficial</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-black tracking-[-0.04em] text-[var(--club-ink)] md:text-5xl">
                {hero?.title ?? profile.config.name}
              </h1>
              {profile.config.verified ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--club-primary)]/10 px-3 py-1 text-xs font-bold text-[var(--club-primary)]">
                  <ShieldCheck aria-hidden="true" className="size-4" /> Verificado
                </span>
              ) : null}
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--club-ink-muted)]">
              {hero?.description ?? `${profile.config.name} en ${profile.config.city}. Reserva pistas y consulta la actividad del club.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={clubId ? `/reservar?clubId=${clubId}` : "/reservar"}
                className="inline-flex min-h-12 items-center rounded-[var(--club-radius)] bg-[var(--club-primary)] px-5 font-semibold text-white transition-colors hover:bg-[var(--club-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-primary)]"
              >
                Reservar pista
              </Link>
              <Link
                href="/torneos"
                className="inline-flex min-h-12 items-center rounded-[var(--club-radius)] border border-[var(--club-border)] bg-white px-5 font-semibold text-[var(--club-ink)] transition-colors hover:border-[var(--club-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-primary)]"
              >
                Ver torneos
              </Link>
            </div>
          </div>
          <div className="relative min-h-80 bg-[var(--club-surface-alt)]" aria-label={profile.config.name}>
            {hero?.heroImageUrl ? (
              <>
                <Image
                  src={hero.heroImageUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-black/10" />
              </>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="rounded-[var(--club-radius-lg)] border border-[var(--club-border)] bg-white p-5">
          <p className="text-sm text-[var(--club-ink-muted)]">Ciudad</p>
          <p className="mt-1 text-xl font-bold text-[var(--club-ink)]">{profile.config.city}</p>
        </article>
        <article className="rounded-[var(--club-radius-lg)] border border-[var(--club-border)] bg-white p-5">
          <p className="text-sm text-[var(--club-ink-muted)]">Pistas</p>
          <p className="mt-1 text-xl font-bold text-[var(--club-ink)]">{courts.length || "Por confirmar"}</p>
        </article>
        <article className="rounded-[var(--club-radius-lg)] border border-[var(--club-border)] bg-white p-5">
          <p className="text-sm text-[var(--club-ink-muted)]">Desde</p>
          <p className="mt-1 text-xl font-bold text-[var(--club-primary)]">{formatCop(profile.config.pricing.offPeakPriceInCents)}</p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <article className="rounded-[var(--club-radius-lg)] border border-[var(--club-border)] bg-white p-6">
          <h2 className="text-2xl font-bold text-[var(--club-ink)]">Sobre el club</h2>
          <p className="mt-3 whitespace-pre-line leading-7 text-[var(--club-ink-muted)]">
            {profile.club?.content.about ?? profile.config.cancellationPolicy.summary}
          </p>
        </article>
        <article className="rounded-[var(--club-radius-lg)] border border-[var(--club-border)] bg-white p-6">
          <h2 className="text-2xl font-bold text-[var(--club-ink)]">Canchas</h2>
          <div className="mt-4 space-y-3">
            {courts.length === 0 ? (
              <p className="text-sm text-[var(--club-ink-muted)]">Las pistas se publicarán pronto.</p>
            ) : (
              courts.map((court) => (
                <div key={court.id} className="rounded-[var(--club-radius)] bg-[var(--club-surface-alt)] px-4 py-3">
                  <p className="font-semibold text-[var(--club-ink)]">{court.name}</p>
                  <p className="text-sm text-[var(--club-ink-muted)]">{court.courtType} · {court.indoor ? "Cubierta" : "Exterior"}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
