import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--club-border)] bg-white flex-shrink-0 hidden md:flex flex-col">
        <div className="p-4 border-b border-[var(--club-border)]">
          <Link href="/admin" className="text-lg font-bold text-[var(--club-ink)]">
            El Remate
          </Link>
          <p className="text-xs text-[var(--club-ink-muted)]">Panel de Administración</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { href: "/admin", label: "Dashboard", icon: "📊" },
            { href: "/admin/calendario", label: "Calendario", icon: "📅" },
            { href: "/admin/socios", label: "Socios", icon: "👥" },
            { href: "/admin/politicas", label: "Políticas", icon: "⚙️" },
            { href: "/admin/anuncios", label: "Anuncios", icon: "📢" },
            { href: "/admin/contenido", label: "Contenido", icon: "📝" },
            { href: "/admin/apariencia", label: "Apariencia", icon: "🎨" },
          ].map((item) => (
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
        <div className="p-3 border-t border-[var(--club-border)]">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--club-ink-muted)] hover:text-[var(--club-ink)]"
          >
            ← Volver al Club
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--club-border)] bg-white">
        <div className="flex">
          {[
            { href: "/admin", label: "Home", icon: "📊" },
            { href: "/admin/calendario", label: "Calen.", icon: "📅" },
            { href: "/admin/socios", label: "Socios", icon: "👥" },
          ].map((item) => (
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
