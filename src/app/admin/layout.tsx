import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CLUB_CONFIG, MODULE_FLAGS } from "@/padelbacano.config";
import { auth } from "@/infra/auth/config";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: `Panel de administración — ${CLUB_CONFIG.shortName}`,
    template: `%s | ${CLUB_CONFIG.shortName}`,
  },
  description: `Panel de administración de ${CLUB_CONFIG.name}. Gestiona reservas, canchas, torneos y más.`,
  robots: {
    index: false,
    follow: false,
  },
};

type NavItem = {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session.user.role !== "club_admin" && session.user.role !== "platform_admin") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--club-surface)] p-6">
        <div className="rounded-[var(--club-radius-lg)] border border-[var(--club-border)] bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">403 Forbidden</h1>
          <p className="mt-2 text-sm text-[var(--club-ink-muted)]">No autorizado</p>
        </div>
      </main>
    );
  }

  const isPlatformAdmin = session.user.role === "platform_admin";

  const navItems: NavItem[] = isPlatformAdmin
    ? [
        { href: "/admin/aprobaciones", label: "Aprobaciones", icon: "✅" },
        { href: "/", label: "Ver sitio", icon: "🏠" },
      ]
    : [
        { href: "/admin", label: "Dashboard", icon: "📊" },
        { href: "/admin/calendario", label: "Calendario", icon: "📅" },
        ...(MODULE_FLAGS.social ? [{ href: "/admin/anuncios", label: "Anuncios", icon: "📢" }] : []),
        ...(MODULE_FLAGS.tournaments ? [{ href: "/admin/torneos", label: "Torneos", icon: "🏆" }] : []),
        ...(MODULE_FLAGS.payments ? [{ href: "/admin/pagos", label: "Pagos", icon: "💳" }] : []),
        ...(MODULE_FLAGS.school ? [{ href: "/admin/contenido", label: "Escuela", icon: "🎓" }] : []),
        ...(MODULE_FLAGS.analytics ? [{ href: "/admin/analytics", label: "Analytics", icon: "📈" }] : []),
        ...(MODULE_FLAGS.invoicing ? [{ href: "/admin/facturacion", label: "Facturación", icon: "🧾" }] : []),
      ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--club-border)] bg-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-[var(--club-border)]">
          <Link href="/admin" className="text-lg font-bold text-[var(--club-ink)]">
            {CLUB_CONFIG.shortName}
          </Link>
          <p className="text-xs text-[var(--club-ink-muted)]">Panel de Administración</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-[var(--club-radius)] text-sm text-[var(--club-ink-muted)] hover:bg-[var(--club-surface-alt)] hover:text-[var(--club-ink)] transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--club-border)] bg-white">
        <div className="flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center py-2 text-xs text-[var(--club-ink-muted)] hover:text-[var(--club-ink)]"
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-6 pb-20 md:pb-6 bg-[var(--club-surface)]">
        {children}
      </main>
    </div>
  );
}
