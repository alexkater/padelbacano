import { CLUB_CONFIG } from "@/padelbacano.config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${CLUB_CONFIG.name} — ${CLUB_CONFIG.location}`,
  description: "Gestiona tu club de pádel con PádelBacano.",
};

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── Header / Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[var(--club-border)] bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="El Remate" className="h-10 w-auto" />
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/#instalaciones" className="text-sm text-[var(--club-ink-muted)] hover:text-[var(--club-ink)] transition-colors">Instalaciones</Link>
            <Link href="/#precios" className="text-sm text-[var(--club-ink-muted)] hover:text-[var(--club-ink)] transition-colors">Precios</Link>
            <Link href="/#contacto" className="text-sm text-[var(--club-ink-muted)] hover:text-[var(--club-ink)] transition-colors">Contacto</Link>
            <Link href="/tablon" className="text-sm text-[var(--club-ink-muted)] hover:text-[var(--club-ink)] transition-colors">Tablón</Link>
            <Link href="/escuela" className="text-sm text-[var(--club-ink-muted)] hover:text-[var(--club-ink)] transition-colors">Escuela</Link>
            <Link href="/torneos" className="text-sm text-[var(--club-ink-muted)] hover:text-[var(--club-ink)] transition-colors">Torneos</Link>
          </nav>
          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/perfil" className="text-sm text-[var(--club-ink-muted)] hover:text-[var(--club-ink)] hidden md:block">
              Perfil
            </Link>
            <Link href="/reservar">
              <Button size="sm">Reservar Pista</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Page content ──────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--club-border)] bg-[var(--club-surface-alt)]">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img src="/logo.png" alt="El Remate" className="h-12 w-auto mb-3 opacity-80" />
            <p className="text-sm text-[var(--club-ink-muted)]">
              11 pistas indoor de cristal cubiertas en Sevilla.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[var(--club-ink)] mb-3">Contacto</h4>
            <div className="text-sm text-[var(--club-ink-muted)] space-y-1">
              <p>📞 619 81 74 51</p>
              <p>📧 elrematepadelclub@gmail.com</p>
              <p>📍 Av. Montes Sierra, 38 — Sevilla 41007</p>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-[var(--club-ink)] mb-3">Horario</h4>
            <p className="text-sm text-[var(--club-ink-muted)]">
              Lunes a domingo: 9:00 – 00:00
            </p>
          </div>
        </div>
        <div className="border-t border-[var(--club-border)] py-4 text-center text-xs text-[var(--club-ink-muted)]">
          © {new Date().getFullYear()} ${CLUB_CONFIG.name} — Powered by PádelBacano
        </div>
      </footer>
    </div>
  );
}
