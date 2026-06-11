import { CLUB_CONFIG } from "@/padelbacano.config";
import Link from "next/link";
import { clubRepo } from "@/infra/db/repositories";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnnouncementFeed } from "@/modules/social/components";
import "../../hero.css";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);

  if (!club) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[var(--club-ink)]">Club no encontrado</h1>
      </div>
    );
  }

  const { content, courts, pricing } = club;

  return (
    <>
      <section className="relative hero-bg text-white overflow-hidden min-h-[500px] md:min-h-[600px] flex items-center">
        {/* Celeste overlay — left side */}
        <div className="absolute inset-0 hero-overlay z-10" />
        {/* Content */}
        <div className="relative z-20 max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24 w-full">
          <div className="max-w-xl">
            {/* Small brand label */}
            <p className="text-xs md:text-sm tracking-[0.4em] uppercase text-white/60 mb-6 font-medium">
              {CLUB_CONFIG.shortName}
            </p>
            {/* Huge title — Anton display font */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl uppercase leading-[0.85] mb-6 tracking-[-0.02em]" style={{ fontFamily: "var(--font-display)" }}>
              Pádel<br />Club
            </h1>
            {/* Description */}
            <p className="text-sm md:text-base text-white/60 mb-8 max-w-md leading-relaxed">
              {content.hero.description}
            </p>
            {/* CTA */}
            <Link href="/reservar">
              <Button size="lg" className="bg-white text-black hover:bg-white/90 font-semibold px-8 rounded-none uppercase tracking-wider text-sm">
                Reserva de Pista
              </Button>
            </Link>
          </div>
        </div>
        {/* Bottom fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10" />
      </section>

      {/* Sub-hero — matching original site layout */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-[var(--club-ink-muted)] mb-2 font-medium">
              Tu club de
            </p>
            <h2 className="text-4xl md:text-5xl font-black uppercase text-[var(--club-ink)] leading-[0.9] tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              Pádel en Sevilla
            </h2>
          </div>
          <div className="flex gap-4">
            <Link href="/reservar">
              <Button className="bg-[var(--club-ink)] text-white hover:bg-[var(--club-ink)]/90 font-semibold uppercase tracking-wider text-xs px-6 rounded-none">
                Reserva de Pista
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 md:px-8 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pistas", value: String(courts.length) },
            { label: "Indoor", value: courts.every((c) => c.indoor) ? "100%" : "—" },
            { label: "Horario", value: content.openingHours.split("de")[1]?.trim() ?? "9-24h" },
            { label: "Días/semana", value: "7" },
          ].map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent>
                <p className="text-3xl font-bold text-[var(--club-primary)]">{stat.value}</p>
                <p className="text-sm text-[var(--club-ink-muted)] mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Facilities */}
      <section id="instalaciones" className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-[var(--club-ink)] mb-4">Instalaciones</h2>
        <p className="text-[var(--club-ink-muted)] mb-8 max-w-2xl">{content.about}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Pistas de Cristal", desc: `${courts.length} pistas cubiertas con cristal.` },
            { title: "Escuela de Pádel", desc: "Clases para todos los niveles y edades." },
            { title: "Bar & Terraza", desc: "Zona de descanso con bar completo." },
          ].map((item) => (
            <Card key={item.title}>
              <CardContent>
                <h3 className="font-semibold text-[var(--club-ink)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--club-ink-muted)]">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Prices */}
      <section id="precios" className="bg-[var(--club-surface-alt)] py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-[var(--club-ink)] mb-4">Tarifas</h2>
          <p className="text-[var(--club-ink-muted)] mb-8 max-w-lg whitespace-pre-line">{content.prices}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <Card>
              <CardContent>
                <h3 className="font-semibold text-lg mb-1">No Socios</h3>
                <p className="text-3xl font-bold text-[var(--club-primary)]">{pricing.nonMemberPrice} €</p>
                <p className="text-sm text-[var(--club-ink-muted)]">por persona · 90 min</p>
              </CardContent>
            </Card>
            <Card className="border-[var(--club-primary)] border-2">
              <CardContent>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">Socios</h3>
                  <Badge variant="success">Recomendado</Badge>
                </div>
                <p className="text-3xl font-bold text-[var(--club-primary)]">{pricing.memberPrice} €</p>
                <p className="text-sm text-[var(--club-ink-muted)]">por persona · 90 min</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* News feed */}
      <AnnouncementFeed />

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-[var(--club-ink)] mb-4">¿Listo para jugar?</h2>
        <p className="text-[var(--club-ink-muted)] mb-8 max-w-md mx-auto">
          Reserva tu pista en menos de un minuto. Sin llamadas, sin esperas.
        </p>
        <Link href="/reservar">
          <Button size="lg">Reservar Ahora</Button>
        </Link>
      </section>
    </>
  );
}
