// ─── In-memory search cache with 5-minute TTL ───────────────────────────────
// Wraps marketplace search results so repeated queries (same filters) hit memory
// instead of the database. Cache is per-request-scope via a shared Map.

import type { SearchFilters, SearchResponse } from "@/core/entities/marketplace";

const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes

type CacheEntry = {
  readonly data: SearchResponse;
  readonly expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

/** Serialize search filters to a stable cache key (sorted by key). */
function cacheKey(filters: SearchFilters): string {
  const entries = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

/** Evict all expired entries. Called lazily before every read. */
function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (now >= entry.expiresAt) {
      cache.delete(key);
    }
  }
}

/** Evict a specific cache key (e.g. after a booking changes availability). */
export function evictSearchCache(filters?: SearchFilters): void {
  if (filters) {
    cache.delete(cacheKey(filters));
  } else {
    cache.clear();
  }
}

/**
 * Wrap a search function with an in-memory 5-minute TTL cache.
 * - Returns cached result if available and not expired.
 * - Otherwise calls `searchFn`, stores the result, and returns it.
 * - Cache key is a deterministic JSON serialisation of search filters.
 */
export function withSearchCache(
  searchFn: (filters: SearchFilters) => Promise<SearchResponse>,
): (filters: SearchFilters) => Promise<SearchResponse> {
  return async (filters: SearchFilters): Promise<SearchResponse> => {
    evictExpired();
    const key = cacheKey(filters);
    const existing = cache.get(key);
    if (existing && Date.now() < existing.expiresAt) {
      return existing.data;
    }
    const data = await searchFn(filters);
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
    return data;
  };
}
