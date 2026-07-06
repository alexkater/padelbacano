"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Search, User, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";

type NavItem = {
  readonly href: string;
  readonly label: string;
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/buscar", label: "Buscar" },
  { href: "/clubes", label: "Para clubes" },
  { href: "/perfil", label: "Mis reservas" },
] as const;

function NavLink({ href, label, active }: NavItem & { readonly active: boolean }) {
  return (
    <Link
      className={`text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] rounded-[var(--pb-radius-sm)] ${
        active
          ? "text-[var(--pb-brand-primary)]"
          : "text-[var(--pb-text-secondary)] hover:text-[var(--pb-brand-primary)]"
      }`}
      href={href}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

function DrawerNavLink({ href, label, active, onClick }: NavItem & { readonly active: boolean; readonly onClick: () => void }) {
  return (
    <Link
      className={`block rounded-[var(--pb-radius-md)] px-[var(--pb-space-3)] py-[var(--pb-space-3)] text-base font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] ${
        active
          ? "bg-[var(--pb-surface-secondary)] text-[var(--pb-brand-primary)]"
          : "text-[var(--pb-text-primary)] hover:bg-[var(--pb-surface-secondary)]"
      }`}
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

export function MarketplaceNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[var(--pb-layout-max)] items-center justify-between px-[var(--pb-space-4)] md:px-[var(--pb-space-6)]">
        {/* Logo */}
        <Link
          href="/buscar"
          className="inline-flex min-h-11 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] font-bold tracking-[-0.02em] text-[var(--pb-text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
        >
          <span className="grid size-9 place-items-center rounded-[var(--pb-radius-sm)] bg-[var(--pb-brand-primary)] text-[var(--pb-brand-foreground)]">
            <Search aria-hidden="true" className="size-5" strokeWidth={2} />
          </span>
          <span>PádelBacano</span>
        </Link>

        {/* Desktop nav — hidden on mobile */}
        <nav aria-label="Navegación principal" className="hidden items-center gap-[var(--pb-space-6)] md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={pathname.startsWith(item.href)}
            />
          ))}
        </nav>

        {/* Right side: auth-aware buttons */}
        <div className="flex items-center gap-[var(--pb-space-3)]">
          {isAuthenticated ? (
            <>
              <Link
                href="/perfil"
                className="hidden min-h-10 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-full)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] text-sm font-semibold text-[var(--pb-text-primary)] transition-colors hover:border-[var(--pb-border-strong)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] sm:inline-flex"
              >
                <User className="size-4" />
                {session?.user?.name ?? "Cuenta"}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden min-h-10 items-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-full)] border border-[var(--pb-border-subtle)] px-[var(--pb-space-3)] text-sm font-medium text-[var(--pb-text-secondary)] transition-colors hover:border-[var(--pb-status-error)] hover:text-[var(--pb-status-error)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] sm:inline-flex"
              >
                <LogOut className="size-4" />
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden min-h-10 items-center rounded-[var(--pb-radius-full)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] text-sm font-semibold text-[var(--pb-text-primary)] transition-colors hover:border-[var(--pb-border-strong)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] sm:inline-flex"
            >
              Entrar
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--pb-radius-md)] text-[var(--pb-text-primary)] transition-colors hover:bg-[var(--pb-surface-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] md:hidden"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            type="button"
          >
            {menuOpen ? <X className="size-6" strokeWidth={2} /> : <Menu className="size-6" strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[var(--pb-overlay-scrim)]"
            onClick={closeMenu}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <div
            className="absolute bottom-0 left-0 right-0 flex max-h-[70dvh] flex-col rounded-t-[var(--pb-radius-xl)] bg-[var(--pb-surface-primary)] shadow-[var(--pb-shadow-overlay)] animate-in slide-in-from-bottom"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="flex items-center justify-between border-b border-[var(--pb-border-subtle)] px-[var(--pb-space-4)] py-[var(--pb-space-4)]">
              <span className="text-sm font-bold text-[var(--pb-text-primary)]">Menú</span>
              <button
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-[var(--pb-radius-md)] text-[var(--pb-text-secondary)] hover:bg-[var(--pb-surface-secondary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
                onClick={closeMenu}
                aria-label="Cerrar menú"
                type="button"
              >
                <X className="size-5" strokeWidth={2} />
              </button>
            </div>
            <nav aria-label="Navegación móvil" className="flex-1 overflow-y-auto px-[var(--pb-space-3)] py-[var(--pb-space-3)]">
              {NAV_ITEMS.map((item) => (
                <DrawerNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  active={pathname.startsWith(item.href)}
                  onClick={closeMenu}
                />
              ))}
            </nav>
            <div className="border-t border-[var(--pb-border-subtle)] px-[var(--pb-space-4)] py-[var(--pb-space-4)]">
              {isAuthenticated ? (
                <div className="space-y-[var(--pb-space-2)]">
                  <Link
                    className="flex min-h-11 w-full items-center justify-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] text-sm font-semibold text-[var(--pb-brand-foreground)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
                    href="/perfil"
                    onClick={closeMenu}
                  >
                    Mi cuenta
                  </Link>
                  <button
                    className="flex min-h-11 w-full items-center justify-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] border border-[var(--pb-border-subtle)] text-sm font-medium text-[var(--pb-text-secondary)] transition-colors hover:border-[var(--pb-status-error)] hover:text-[var(--pb-status-error)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
                    onClick={() => { closeMenu(); signOut({ callbackUrl: "/" }); }}
                  >
                    <LogOut className="size-4" />
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <Link
                  className="flex min-h-11 w-full items-center justify-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] text-sm font-semibold text-[var(--pb-brand-foreground)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]"
                  href="/login"
                  onClick={closeMenu}
                >
                  Entrar o registrarse
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
