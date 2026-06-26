// ─── Marketplace entity types ───────────────────────────────────────────────
// DTOs e interfaces compartidas para el marketplace multi-club Colombia-wide.
// Todos los precios en centavos COP (enteros), nunca floats.
// Domain context: búsqueda de clubes de pádel/tenis por ciudad, fecha y precio.

import type { CourtType } from "./court";

// ─── Search filters ─────────────────────────────────────────────────────────

/**
 * Filtros de búsqueda para el marketplace.
 * Todos los parámetros son opcionales; una búsqueda vacía devuelve todos los clubes activos.
 */
export type SearchFilters = {
  /** Ciudad (acentos insensibles: "Bogotá" = "Bogota") */
  city?: string;
  /** Fecha deseada para la reserva (ISO string yyyy-mm-dd) */
  date?: string;
  /** Hora de inicio deseada (HH:mm, 24h) */
  time?: string;
  /** Inicio opcional del rango horario (HH:mm, 24h) */
  timeStart?: string;
  /** Fin opcional del rango horario (HH:mm, 24h) */
  timeEnd?: string;
  /** Precio mínimo por slot en centavos COP */
  minPriceCents?: number;
  /** Precio máximo por slot en centavos COP */
  maxPriceCents?: number;
  /** Tipo de cancha (glass, panoramic, wall) */
  courtType?: CourtType;
  /** Indoor (true) o outdoor (false). undefined = ambos */
  indoor?: boolean;
  /** Deporte: "padel" | "tenis" */
  sport?: "padel" | "tenis";
  /** Número de página (1-indexed) */
  page?: number;
  /** Resultados por página (máx 50) */
  limit?: number;
};

// ─── Club search result ─────────────────────────────────────────────────────

/**
 * Resultado individual en la lista de búsqueda del marketplace.
 * Contiene solo campos públicos — nunca phone, email, NIT, revenue, staff.
 */
export type ClubSearchResult = {
  /** ID público del club */
  id: string;
  /** Slug único para URL (ej. "club-bogota") */
  slug: string;
  /** Nombre comercial del club */
  name: string;
  /** Ciudad del club */
  city: string;
  /** Número total de canchas activas */
  courtCount: number;
  /** Precio más bajo disponible en centavos COP */
  minPriceCents: number;
  /** Próximo slot disponible (ISO datetime) */
  nextAvailableSlot: string | null;
  /** Club verificado (badge de confianza) */
  isVerified: boolean;
  /** Tipos de cancha disponibles */
  courtTypes: CourtType[];
  /** Latitud (para orden por distancia) */
  latitude: number | null;
  /** Longitud (para orden por distancia) */
  longitude: number | null;
};

// ─── Club public detail ─────────────────────────────────────────────────────

/**
 * Perfil público completo de un club en el marketplace.
 * Extiende ClubSearchResult con información detallada.
 */
export type ClubPublicDetail = ClubSearchResult & {
  /** Lista completa de canchas con sus tipos */
  courts: ClubPublicCourt[];
  /** Precios por tipo de cancha en centavos COP */
  pricing: ClubPublicPricing;
  /** Dirección del club */
  address: string;
  /** URL de Google Maps */
  googleMapsUrl: string | null;
  /** URL del logo del club */
  logoUrl: string | null;
  /** URLs de fotos del club */
  photos: string[];
  /** Servicios/amenidades disponibles */
  amenities: string[];
  /** Política de cancelación */
  cancellationPolicy: ClubPublicCancellationPolicy;
  /** Horario de apertura (ej. "Lun-Vie 6:00-22:00, Sáb-Dom 7:00-21:00") */
  openingHours: string;
  /** Descripción corta del club */
  description: string;
};

/**
 * Cancha visible en el perfil público del club.
 */
export type ClubPublicCourt = {
  /** ID de la cancha */
  id: string;
  /** Nombre (ej. "Cancha 1", "Central") */
  name: string;
  /** Tipo de superficie */
  courtType: CourtType;
  /** Indoor o outdoor */
  indoor: boolean;
};

/**
 * Precios públicos del club.
 * Todos los valores en centavos COP.
 */
export type ClubPublicPricing = {
  /** Precio hora punta en centavos COP */
  peakPriceCents: number;
  /** Precio hora valle en centavos COP */
  offPeakPriceCents: number;
  /** Moneda (siempre "COP") */
  currency: string;
};

/**
 * Política de cancelación visible al público.
 */
export type ClubPublicCancellationPolicy = {
  /** Horas mínimas de antelación para cancelación gratuita */
  minHoursBefore: number;
  /** Porcentaje de penalización por cancelación tardía (0-100) */
  penaltyPercent: number;
  /** Resumen en texto plano (ej. "Cancelación gratuita hasta 2h antes") */
  summary: string;
};

// ─── Court availability ─────────────────────────────────────────────────────

/**
 * Slot de disponibilidad individual para una cancha.
 */
export type CourtAvailabilitySlot = {
  /** ID de la cancha */
  courtId: string;
  /** Nombre de la cancha */
  courtName: string;
  /** Inicio del slot (ISO datetime) */
  startTime: string;
  /** Fin del slot (ISO datetime) */
  endTime: string;
  /** Precio en centavos COP */
  priceInCents: number;
  isPeak: boolean;
  /** Disponible para reservar */
  isAvailable: boolean;
};

/**
 * Disponibilidad completa de una cancha.
 */
export type CourtAvailability = {
  /** ID de la cancha */
  courtId: string;
  /** Nombre de la cancha */
  courtName: string;
  /** Tipo de cancha */
  courtType: CourtType;
  /** Slots disponibles */
  slots: CourtAvailabilitySlot[];
  /** Bloques de mantenimiento (no disponibles) */
  maintenanceBlocks: MaintenanceBlock[];
};

/**
 * Bloque de mantenimiento de una cancha.
 */
export type MaintenanceBlock = {
  /** Inicio del bloque (ISO datetime) */
  startTime: string;
  /** Fin del bloque (ISO datetime) */
  endTime: string;
  /** Razón del mantenimiento */
  reason: string;
};

// ─── Search response ────────────────────────────────────────────────────────

/**
 * Faceta de búsqueda para filtros en UI.
 */
export type SearchFacet = {
  /** Nombre de la faceta (ej. "city", "courtType") */
  name: string;
  /** Valores disponibles con conteo */
  values: { label: string; count: number }[];
};

/**
 * Información de paginación.
 */
export type PageInfo = {
  /** Página actual (1-indexed) */
  page: number;
  /** Resultados por página */
  limit: number;
  /** Total de resultados */
  total: number;
  /** Total de páginas */
  totalPages: number;
  /** ¿Hay más páginas? */
  hasNextPage: boolean;
  /** ¿Hay página anterior? */
  hasPrevPage: boolean;
};

/**
 * Respuesta completa de búsqueda del marketplace.
 */
export type SearchResponse = {
  /** Resultados de la búsqueda */
  results: ClubSearchResult[];
  /** Total de resultados */
  total: number;
  /** Información de paginación */
  pageInfo: PageInfo;
  /** Facetas para filtros */
  facets: SearchFacet[];
};

// ─── Marketplace search port ────────────────────────────────────────────────

/**
 * Puerto del caso de uso de búsqueda en el marketplace.
 * Las rutas API dependen de este puerto, no de implementaciones infra.
 */
export interface MarketplaceSearchPort {
  /**
   * Buscar clubes disponibles según los filtros.
   * Retorna solo clubes activos y aprobados.
   */
  search(filters: SearchFilters): Promise<SearchResponse>;

  /**
   * Obtener detalle público de un club por slug.
   */
  getClubDetail(slug: string): Promise<ClubPublicDetail | null>;

  /**
   * Obtener disponibilidad de canchas para un club en una fecha.
   */
  getAvailability(
    clubId: string,
    date: string,
    sport?: "padel" | "tenis"
  ): Promise<CourtAvailability[]>;
}
