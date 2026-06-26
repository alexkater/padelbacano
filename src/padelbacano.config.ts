// ─── PádelBacano — Bootstrap/fallback config legacy ─────────────────────────
// DEPRECATED para runtime marketplace: la fuente de verdad es la tabla DB
// `club_configs` vía ClubConfigPort/TenantContext. Este archivo queda solo para
// bootstrap local, demos legacy single-club y fallback explícito durante migración.
// Mantener exports existentes por compatibilidad temporal.
//
// Para vender a un club nuevo:
//   1. Cambiar los valores de abajo
//   2. Correr `npm run seed`
//   3. La IA personaliza textos, colores y fotos
//   4. Desplegar en Vercel con subdominio propio

export const CLUB_CONFIG = {
  /** Slug URL del club (usado en rutas, API calls, DB lookup) */
  slug: "club-bogota" as string,

  /** Nombre comercial completo */
  name: "PádelBacano" as string,

  /** Nombre corto para headers, títulos */
  shortName: "PádelBacano" as string,

  /** Ciudad / ubicación principal */
  location: "Colombia" as string,

  /** Email from para envíos (SMTP_FROM en prod) */
  fromEmail: "noreply@padelbacano.com" as string,

  /** Dominio principal (usado para metadata, OG tags) */
  domain: "padelbacano.com" as string,
} as const;

// ─── Theme ──────────────────────────────────────────────────────────────────

export const THEME = {
  /** Color primario del club (botones, enlaces, acentos) */
  primaryColor: "#1a3a2a",
  /** Color de fondo principal */
  surfaceColor: "#d4eaf7",
  /** Tipografía Google Font */
  fontFamily: "Saira",
  /** Tipografía display (títulos grandes) */
  displayFont: "Anton",
  /** Logo del club (ruta en /public) */
  logoUrl: "/logo.png",
  /** Favicon (ruta en /public) */
  faviconUrl: "/icon.png",
  /** Radio de bordes de componentes */
  borderRadius: "md" as "none" | "sm" | "md" | "lg",

  /** Colores semánticos (opcional, se derivan del primario si no se definen) */
  dangerColor: "#dc2626",
  warningColor: "#d97706",
  successColor: "#1a3a2a",

  /** Hero section */
  heroImageUrl: "/hero-bg.jpg",
  heroOverlayColor: "rgba(180, 215, 235, 0.75)",

  /** Footer info */
  showFooter: true,
} as const;

// ─── Module flags ───────────────────────────────────────────────────────────
// Audit 2026-06-24: each flag reflects whether the module has real (non-stub)
// implementation — ports, entities, DB schema, API routes, and admin UI.
// Flags are fallback defaults; marketplace tenants override via club_configs.modules.
//
// Activation criteria: port + entity + DB schema + API route + admin page exist.
// Deactivation criteria: truly nothing implemented (stub only).

export const MODULE_FLAGS = {
  /** Tablón de comunidad + anuncios + partidos abiertos
   *  STATUS: ACTIVATED — 4 UI components, 3 API routes, DB tables, admin page */
  social: true,
  /** Torneos y competiciones (CRUD, sin bracket engine aún)
   *  STATUS: ACTIVATED — ITournamentPort, DB schema (4 tables), API CRUD, admin page
   *  PENDING: bracket engine (T38-T39, Wave 6) */
  tournaments: true,
  /** Pasarela de pagos (PSE, Nequi, Daviplata, tarjeta, efectivo)
   *  STATUS: ACTIVATED — 5 gateway implementations (demo mode), API process/methods/revenue, admin page
   *  PENDING: real API integration (ePayco/PayU/Wompi) */
  payments: true,
  /** Escuela de pádel (gestión de clases, alumnos, entrenadores)
   *  STATUS: ACTIVATED — school-repo, DB schema (coaches, classes, enrollments), API routes
   *  PENDING: admin UI page for school management */
  school: true,
  /** BI y analítica avanzada
   *  STATUS: ACTIVATED — analytics-repo, daily_summaries table, API overview, admin dashboard
   *  PENDING: advanced charts, export, real-time (Wave 7) */
  analytics: true,
  /** Facturación electrónica DIAN (Colombia)
   *  STATUS: ACTIVATED — InvoicePort, DB schema (invoices, invoice_items), API CRUD + PDF, admin page
   *  PENDING: DIAN XML/CUFE signing (T34, Wave 5) */
  invoicing: true,
  /** Programa de fidelización / puntos
   *  STATUS: NOT ACTIVATED — no port, no entity, no schema, no API, no UI.
   *  Requires: loyalty entity + port + schema + API + admin page (v2) */
  loyalty: false,
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Helper: slug tipado con el valor de config */
export type ClubSlug = typeof CLUB_CONFIG.slug;

/** CSS custom properties generadas desde THEME */
export function themeToCSSVars(): Record<string, string> {
  const { borderRadius } = THEME;
  const radiusMap = { none: "0", sm: "0.25rem", md: "0.5rem", lg: "0.75rem" };

  return {
    "--club-primary": THEME.primaryColor,
    "--club-primary-hover": adjustColor(THEME.primaryColor, -20),
    "--club-primary-foreground": "#ffffff",
    "--club-surface": THEME.surfaceColor,
    "--club-surface-alt": adjustColor(THEME.surfaceColor, -5),
    "--club-border": adjustColor(THEME.surfaceColor, -15),
    "--club-ink": "#1a1a1a",
    "--club-ink-muted": "#5a5a5a",
    "--club-radius": radiusMap[borderRadius],
    "--club-radius-sm": radiusMap[borderRadius === "none" ? "sm" : borderRadius],
    "--club-radius-lg": radiusMap[borderRadius === "lg" ? "md" : (borderRadius === "md" ? "lg" : "md")],
    "--club-radius-xl": "1rem",
    "--club-danger": THEME.dangerColor,
    "--club-danger-hover": adjustColor(THEME.dangerColor, -20),
    "--club-danger-bg": "#fef2f2",
    "--club-warning": THEME.warningColor,
    "--club-warning-bg": "#fffbeb",
    "--club-success": THEME.successColor,
    "--club-success-bg": "#ecfdf5",
    "--font-display-css": `'${THEME.displayFont}', ui-sans-serif, system-ui, sans-serif`,
  };
}

/** Oscurece/aclara un color hex (valor aproximado) */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
