// ─── PádelBacano — Configuración central por instancia ─────────────────────
// Este es el ÚNICO archivo que cambia entre despliegues de cliente.
// Todo el resto del código consume de aquí.
//
// Para vender a un club nuevo:
//   1. Cambiar los valores de abajo
//   2. Correr `npm run seed`
//   3. La IA personaliza textos, colores y fotos
//   4. Desplegar en Vercel con subdominio propio

export const CLUB_CONFIG = {
  /** Slug URL del club (usado en rutas, API calls, DB lookup) */
  slug: "el-remate" as string,

  /** Nombre comercial completo */
  name: "El Remate Padel Club" as string,

  /** Nombre corto para headers, títulos */
  shortName: "El Remate" as string,

  /** Ciudad / ubicación principal */
  location: "Sevilla" as string,

  /** Email from para envíos (SMTP_FROM en prod) */
  fromEmail: "noreply@elrematepadel.com" as string,

  /** Dominio principal (usado para metadata, OG tags) */
  domain: "elrematepadel.com" as string,
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

export const MODULE_FLAGS = {
  /** Torneos y competiciones */
  tournaments: true,
  /** Pasarela de pagos (PSE, Nequi, tarjeta) */
  payments: true,
  /** Programa de fidelización / puntos */
  loyalty: false,
  /** Escuela de pádel (gestión de clases, alumnos) */
  school: false,
  /** BI y analítica avanzada */
  analytics: false,
  /** Facturación electrónica DIAN (Colombia) */
  invoicing: false,
  /** Tablón de comunidad + anuncios */
  social: true,
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
