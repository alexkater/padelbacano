// ─── PádelBacano — Configuración central por instancia ─────────────────────
// Este es el ÚNICO archivo que cambia entre despliegues de cliente.
// Todo el resto del código consume de aquí.
//
// Para vender a un club nuevo:
//   1. Cambiar los valores de abajo
//   2. Correr `npm run seed`
//   3. La IA personaliza textos, colores y fotos
//   4. Desplegar

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

export const MODULE_FLAGS = {
  /** Torneos y competiciones */
  tournaments: false,
  /** Pasarela de pagos (PSE, Nequi, tarjeta) */
  payments: false,
  /** Programa de fidelización / puntos */
  loyalty: false,
  /** Escuela de pádel (gestión de clases, alumnos) */
  school: false,
  /** BI y analítica avanzada */
  analytics: false,
  /** Facturación electrónica DIAN (Colombia) */
  invoicing: false,
  /** Tablón de comunidad + chat */
  social: true,
} as const;

export const DEFAULT_THEME = {
  primaryColor: "#1a3a2a",
  surfaceColor: "#d4eaf7",
  fontFamily: "Saira",
  logoUrl: "/logo.png",
  borderRadius: "md" as const,
} as const;

/** Helper: slug tipado con el valor de config */
export type ClubSlug = typeof CLUB_CONFIG.slug;
