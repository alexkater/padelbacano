"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Breadcrumbs } from "@/components/marketplace/breadcrumbs";
import { ClubCard } from "@/components/marketplace/club-card";
import { Button } from "@/components/ui/button";
import type { ClubSearchResult, PageInfo, SearchResponse } from "@/core/entities/marketplace";

const RESULTS_LIMIT = "12";

const clubSearchResultSchema = z.object({
  city: z.string(),
  courtCount: z.number(),
  courtTypes: z.array(z.enum(["glass", "panoramic", "wall"])),
  id: z.string(),
  isVerified: z.boolean(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  minPriceCents: z.number(),
  name: z.string(),
  nextAvailableSlot: z.string().nullable(),
  slug: z.string(),
});

const pageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
  limit: z.number(),
  page: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

const searchResponseSchema = z.object({
  facets: z.array(z.object({ name: z.string(), values: z.array(z.object({ count: z.number(), label: z.string() })) })),
  pageInfo: pageInfoSchema,
  results: z.array(clubSearchResultSchema),
  total: z.number(),
});

const apiResponseSchema = z.object({ data: searchResponseSchema, success: z.literal(true) });

type SearchState =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "success"; readonly pageInfo: PageInfo; readonly results: readonly ClubSearchResult[]; readonly total: number };

type SearchQuery = {
  readonly city: string;
  readonly date: string;
  readonly key: string;
  readonly page: number;
  readonly params: URLSearchParams;
  readonly sport: string;
  readonly time: string;
};

class SearchRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchRequestError";
  }
}

function makeSearchQuery(searchParams: URLSearchParams): SearchQuery {
  const params = new URLSearchParams();
  for (const key of ["city", "date", "time", "timeStart", "timeEnd", "sport", "priceMin", "priceMax", "courtType", "indoor"] as const) {
    const value = searchParams.get(key);
    if (value !== null && value.length > 0) {
      params.set(key, value);
    }
  }
  const page = Number(searchParams.get("page") ?? "1");
  params.set("page", Number.isFinite(page) && page > 0 ? String(page) : "1");
  params.set("limit", RESULTS_LIMIT);

  return {
    city: searchParams.get("city") ?? "",
    date: searchParams.get("date") ?? "",
    key: params.toString(),
    page: Number(params.get("page") ?? "1"),
    params,
    sport: searchParams.get("sport") ?? "",
    time: searchParams.get("time") ?? "",
  };
}

function pageHref(query: SearchQuery, page: number): string {
  const params = new URLSearchParams(query.params);
  params.set("page", String(page));
  return `/buscar/resultados?${params.toString()}`;
}

async function fetchSearchResults(params: URLSearchParams, signal: AbortSignal): Promise<SearchResponse> {
  const response = await fetch(`/api/marketplace/search?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new SearchRequestError("Error al buscar. Intenta de nuevo.");
  }

  const parsed = apiResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new SearchRequestError("Error al leer los resultados. Intenta de nuevo.");
  }

  return parsed.data.data;
}

function SearchResultsSkeleton() {
  return (
    <div className="grid gap-[var(--pb-space-4)] md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]"
          key={index}
        >
          <div className="pb-shimmer h-4 w-24 rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]" />
          <div className="pb-shimmer mt-[var(--pb-space-3)] h-7 w-3/4 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]" />
          <div className="pb-shimmer mt-[var(--pb-space-5)] h-10 rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
          <div className="pb-shimmer mt-[var(--pb-space-3)] h-10 rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
          <div className="pb-shimmer mt-[var(--pb-space-5)] h-16 rounded-[var(--pb-radius-md)] bg-[var(--pb-surface-secondary)]" />
        </div>
      ))}
    </div>
  );
}

function ResultsClient() {
  const searchParams = useSearchParams();
  const query = useMemo(() => makeSearchQuery(searchParams), [searchParams]);
  const [state, setState] = useState<SearchState>({ kind: "loading" });

  const runSearch = useCallback(async (params: URLSearchParams, append: boolean) => {
    const controller = new AbortController();
    setState((current) => (append && current.kind === "success" ? current : { kind: "loading" }));
    try {
      const data = await fetchSearchResults(params, controller.signal);
      setState((current) => ({
        kind: "success",
        pageInfo: data.pageInfo,
        results: append && current.kind === "success" ? [...current.results, ...data.results] : data.results,
        total: data.total,
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (error instanceof SearchRequestError) {
        setState({ kind: "error", message: error.message });
        return;
      }
      setState({ kind: "error", message: "Error al buscar. Intenta de nuevo." });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ kind: "loading" });
    fetchSearchResults(query.params, controller.signal)
      .then((data) => setState({ kind: "success", pageInfo: data.pageInfo, results: data.results, total: data.total }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        if (error instanceof SearchRequestError) {
          setState({ kind: "error", message: error.message });
          return;
        }
        setState({ kind: "error", message: "Error al buscar. Intenta de nuevo." });
      });
    return () => controller.abort();
  }, [query.key, query.params]);

  const loadMore = () => {
    if (state.kind !== "success" || !state.pageInfo.hasNextPage) {
      return;
    }
    const params = new URLSearchParams(query.params);
    params.set("page", String(state.pageInfo.page + 1));
    void runSearch(params, true);
  };

  return (
    <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-10)] text-[var(--pb-text-primary)]">
      <section className="mx-auto w-full max-w-[var(--pb-layout-wide)] space-y-[var(--pb-space-8)]">
        <Breadcrumbs items={[{ label: "Buscar", href: "/buscar" }, { label: query.city.length > 0 ? query.city : "Resultados" }]} />
        <header className="rounded-[var(--pb-radius-xl)] bg-[var(--pb-surface-inverse)] p-[var(--pb-space-6)] text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] md:p-[var(--pb-space-8)]">
          <p className="text-[length:var(--pb-text-overline)] font-bold uppercase tracking-[0.11em] text-[var(--pb-energy-yellow)]">
            Resultados de búsqueda
          </p>
          <h1 className="mt-[var(--pb-space-2)] text-[length:var(--pb-text-h1)] font-extrabold leading-tight tracking-[-0.025em]">
            Clubes disponibles{query.city.length > 0 ? ` en ${query.city}` : " en Colombia"}
          </h1>
          <p className="mt-[var(--pb-space-3)] max-w-3xl text-[length:var(--pb-text-body)] text-[var(--pb-surface-secondary)]">
            {query.date.length > 0 ? `Fecha ${query.date}` : "Elige fecha desde el buscador"}
            {query.time.length > 0 ? ` · Hora ${query.time} COT` : ""}
            {query.sport.length > 0 ? ` · ${query.sport}` : ""}
          </p>
        </header>

        {state.kind === "loading" ? <SearchResultsSkeleton /> : null}

        {state.kind === "error" ? (
          <section className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-status-error)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)]">
            <h2 className="text-[length:var(--pb-text-h3)] font-bold text-[var(--pb-status-error)]">Error al buscar. Intenta de nuevo.</h2>
            <p className="mt-[var(--pb-space-2)] text-[length:var(--pb-text-body-sm)] text-[var(--pb-text-secondary)]">{state.message}</p>
            <Button className="mt-[var(--pb-space-5)] bg-[var(--pb-brand-primary)] text-[var(--pb-brand-foreground)] hover:bg-[var(--pb-brand-hover)]" onClick={() => void runSearch(query.params, false)} type="button">Reintentar búsqueda</Button>
          </section>
        ) : null}

        {state.kind === "success" && state.results.length === 0 ? (
          <section className="rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-8)] text-center shadow-[var(--pb-shadow-card)]">
            <h2 className="text-[length:var(--pb-text-h3)] font-bold">No encontramos clubes en {query.city.length > 0 ? query.city : "esta ciudad"}.</h2>
            <p className="mx-auto mt-[var(--pb-space-2)] max-w-xl text-[length:var(--pb-text-body)] text-[var(--pb-text-secondary)]">
              Prueba otra ciudad o fecha. También puedes ampliar la hora para encontrar más disponibilidad.
            </p>
            <Link className="mt-[var(--pb-space-5)] inline-flex min-h-11 items-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-5)] font-semibold text-[var(--pb-brand-foreground)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]" href="/buscar">
              Volver al buscador
            </Link>
          </section>
        ) : null}

        {state.kind === "success" && state.results.length > 0 ? (
          <>
            <div className="flex items-center justify-between gap-[var(--pb-space-4)]">
              <p className="text-[length:var(--pb-text-body-sm)] font-semibold text-[var(--pb-text-secondary)]">
                {state.total} clubes encontrados
              </p>
              <Link className="text-[length:var(--pb-text-body-sm)] font-semibold text-[var(--pb-brand-primary)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)]" href="/buscar">
                Cambiar búsqueda
              </Link>
            </div>
            <div className="grid gap-[var(--pb-space-4)] md:grid-cols-2 lg:grid-cols-3">
              {state.results.map((club) => (
                <ClubCard club={club} key={club.id} />
              ))}
            </div>
            {state.pageInfo.totalPages > 3 ? <PageNumberPagination pageInfo={state.pageInfo} query={query} /> : null}
            {state.pageInfo.totalPages <= 3 && state.pageInfo.hasNextPage ? (
              <div className="flex justify-center pt-[var(--pb-space-4)]">
                <Button className="min-h-12 bg-[var(--pb-brand-primary)] px-[var(--pb-space-8)] text-[var(--pb-brand-foreground)] hover:bg-[var(--pb-brand-hover)]" onClick={loadMore} type="button">Ver más</Button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}

function PageNumberPagination({ pageInfo, query }: { readonly pageInfo: PageInfo; readonly query: SearchQuery }) {
  return (
    <nav aria-label="Paginación de resultados" className="flex flex-wrap justify-center gap-[var(--pb-space-2)] pt-[var(--pb-space-4)]">
      {Array.from({ length: pageInfo.totalPages }, (_, index) => index + 1).map((page) => (
        <Link
          aria-current={page === pageInfo.page ? "page" : undefined}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--pb-radius-md)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] font-semibold text-[var(--pb-text-primary)] transition-colors hover:border-[var(--pb-brand-primary)] focus-visible:outline-none focus-visible:shadow-[var(--pb-ring-focus)] aria-[current=page]:border-[var(--pb-brand-primary)] aria-[current=page]:bg-[var(--pb-brand-primary)] aria-[current=page]:text-[var(--pb-brand-foreground)]"
          href={pageHref(query, page)}
          key={page}
        >
          {page}
        </Link>
      ))}
    </nav>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={<main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-10)]"><section className="mx-auto w-full max-w-[var(--pb-layout-wide)]"><SearchResultsSkeleton /></section></main>}>
      <ResultsClient />
    </Suspense>
  );
}
