"use client";

import * as Label from "@radix-ui/react-label";
import { CalendarDays, Clock, Loader2, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdvancedSearchSection, type CourtTypeValue, type VenueValue } from "@/components/marketplace/advanced-search-filters";
import { SportSelect, type SportValue } from "@/components/marketplace/sport-select";
import { useId, useMemo, useState, type FormEvent } from "react";

const CITY_SUGGESTIONS = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Bucaramanga",
  "Pereira",
  "Manizales",
] as const;

function normalizeCity(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO");
}

function todayInColombia(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Bogota",
    year: "numeric",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "2026";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function copToCents(value: string): string | null {
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const pesos = Number(trimmedValue);
  if (!Number.isFinite(pesos) || pesos < 0) {
    return null;
  }

  return String(Math.round(pesos * 100));
}

export function MarketplaceSearchPanel() {
  const router = useRouter();
  const cityInputId = useId(); const dateInputId = useId();
  const timeInputId = useId(); const sportInputId = useId();
  const datalistId = useId();
  const today = useMemo(() => todayInColombia(), []);

  const [city, setCity] = useState(""); const [date, setDate] = useState(today);
  const [time, setTime] = useState(""); const [sport, setSport] = useState<SportValue>("all");
  const [minPriceCop, setMinPriceCop] = useState("");
  const [maxPriceCop, setMaxPriceCop] = useState("");
  const [courtType, setCourtType] = useState<CourtTypeValue>("all");
  const [venue, setVenue] = useState<VenueValue>("all");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [cityError, setCityError] = useState("");
  const [dateError, setDateError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const filteredCities = CITY_SUGGESTIONS.filter((suggestion) =>
    normalizeCity(suggestion).includes(normalizeCity(city))
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCity = city.trim();
    const hasCity = trimmedCity.length > 0;
    const hasDate = date.length > 0;
    const minPriceCents = copToCents(minPriceCop);
    const maxPriceCents = copToCents(maxPriceCop);
    const hasValidPriceRange =
      minPriceCents === null || maxPriceCents === null || Number(minPriceCents) <= Number(maxPriceCents);

    setCityError(hasCity ? "" : "Elige una ciudad para buscar canchas.");
    setDateError(hasDate ? "" : "Elige una fecha de juego.");
    setFormError(hasValidPriceRange ? "" : "El precio mínimo debe ser menor o igual al precio máximo.");

    if (!hasCity || !hasDate || !hasValidPriceRange) {
      return;
    }

    const params = new URLSearchParams({ city: trimmedCity, date });

    if (time !== "") {
      params.set("time", time);
    }

    if (time === "" && startTime !== "") {
      params.set("time", startTime);
    }

    if (startTime !== "") {
      params.set("timeStart", startTime);
    }

    if (endTime !== "") {
      params.set("timeEnd", endTime);
    }

    if (sport !== "all") {
      params.set("sport", sport);
    }

    if (minPriceCents !== null) {
      params.set("priceMin", minPriceCents);
    }

    if (maxPriceCents !== null) {
      params.set("priceMax", maxPriceCents);
    }

    if (courtType !== "all") {
      params.set("courtType", courtType);
    }

    if (venue !== "all") {
      params.set("indoor", venue === "indoor" ? "true" : "false");
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/marketplace/search?${params.toString()}&limit=1`, {
        method: "GET",
      });

      if (!response.ok) {
        setFormError("No pudimos validar la búsqueda. Revisa los filtros e intenta de nuevo.");
        return;
      }

      router.push(`/buscar/resultados?${params.toString()}`);
    } catch (error) {
      if (error instanceof Error) {
        setFormError("No hay conexión con el marketplace. Intenta nuevamente en unos segundos.");
        return;
      }

      throw error;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-4)] shadow-[var(--pb-shadow-action)] md:p-[var(--pb-space-6)]"
      noValidate
    >
      <div className="flex items-start justify-between gap-[var(--pb-space-4)]">
        <div>
          <p className="text-[length:var(--pb-text-overline)] font-bold uppercase tracking-[0.11em] text-[var(--pb-brand-primary)]">Buscar disponibilidad</p>
          <h2 className="mt-[var(--pb-space-2)] text-[length:var(--pb-text-h2)] font-bold leading-[1.15] tracking-[-0.02em] text-[var(--pb-text-primary)]">
            Canchas listas para jugar
          </h2>
        </div>
        <span className="hidden rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)] px-[var(--pb-space-3)] py-[var(--pb-space-2)] text-[length:var(--pb-text-caption)] font-semibold text-[var(--pb-text-secondary)] sm:inline-flex">
          COT
        </span>
      </div>

      <div className="mt-[var(--pb-space-6)] grid gap-[var(--pb-space-4)] md:grid-cols-2">
        <div className="md:col-span-2">
          <Label.Root htmlFor={cityInputId} className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]">
            Ciudad
          </Label.Root>
          <div className="relative">
            <MapPin aria-hidden="true" className="pointer-events-none absolute left-[var(--pb-space-3)] top-1/2 size-5 -translate-y-1/2 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
            <input
              id={cityInputId}
              list={datalistId}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="min-h-11 w-full rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] py-[var(--pb-space-3)] pl-[var(--pb-space-10)] pr-[var(--pb-space-3)] text-sm text-[var(--pb-text-primary)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--pb-text-tertiary)] focus:border-[var(--pb-brand-primary)] focus:ring-[var(--pb-ring-focus)] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Bogotá, Medellín, Cali..."
              aria-invalid={cityError !== ""}
              aria-describedby={cityError !== "" ? `${cityInputId}-error` : undefined}
              autoComplete="address-level2"
            />
            <datalist id={datalistId}>
              {filteredCities.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
          </div>
          {cityError !== "" ? (
            <p id={`${cityInputId}-error`} className="mt-[var(--pb-space-2)] text-sm font-medium text-[var(--pb-status-error)]">
              {cityError}
            </p>
          ) : (
            <p className="mt-[var(--pb-space-2)] text-sm text-[var(--pb-text-secondary)]">Acepta variantes sin tilde como Bogota o Medellin.</p>
          )}
        </div>

        <div>
          <Label.Root htmlFor={dateInputId} className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]">
            Fecha
          </Label.Root>
          <div className="relative">
            <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-[var(--pb-space-3)] top-1/2 size-5 -translate-y-1/2 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
            <input
              id={dateInputId}
              type="date"
              min={today}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="min-h-11 w-full rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] py-[var(--pb-space-3)] pl-[var(--pb-space-10)] pr-[var(--pb-space-3)] text-sm text-[var(--pb-text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--pb-brand-primary)] focus:ring-[var(--pb-ring-focus)]"
              aria-invalid={dateError !== ""}
              aria-describedby={dateError !== "" ? `${dateInputId}-error` : undefined}
            />
          </div>
          {dateError !== "" ? (
            <p id={`${dateInputId}-error`} className="mt-[var(--pb-space-2)] text-sm font-medium text-[var(--pb-status-error)]">
              {dateError}
            </p>
          ) : null}
        </div>

        <div>
          <Label.Root htmlFor={timeInputId} className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]">
            Hora opcional
          </Label.Root>
          <div className="relative">
            <Clock aria-hidden="true" className="pointer-events-none absolute left-[var(--pb-space-3)] top-1/2 size-5 -translate-y-1/2 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
            <input
              id={timeInputId}
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="min-h-11 w-full rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] py-[var(--pb-space-3)] pl-[var(--pb-space-10)] pr-[var(--pb-space-3)] text-sm text-[var(--pb-text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--pb-brand-primary)] focus:ring-[var(--pb-ring-focus)]"
            />
          </div>
        </div>

        <SportSelect labelId={sportInputId} value={sport} onValueChange={setSport} />
      </div>

      <AdvancedSearchSection
        courtType={courtType}
        endTime={endTime}
        maxPriceCop={maxPriceCop}
        minPriceCop={minPriceCop}
        onCourtTypeChange={setCourtType}
        onEndTimeChange={setEndTime}
        onMaxPriceCopChange={setMaxPriceCop}
        onMinPriceCopChange={setMinPriceCop}
        onStartTimeChange={setStartTime}
        onVenueChange={setVenue}
        startTime={startTime}
        venue={venue}
      />

      {formError !== "" ? (
        <div className="mt-[var(--pb-space-4)] rounded-[var(--pb-radius-md)] border border-[var(--pb-status-error)] bg-[var(--pb-surface-secondary)] px-[var(--pb-space-4)] py-[var(--pb-space-3)] text-sm font-medium text-[var(--pb-status-error)]">
          {formError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-[var(--pb-space-6)] inline-flex min-h-12 w-full items-center justify-center gap-[var(--pb-space-2)] rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-6)] py-[var(--pb-space-3)] text-base font-bold text-[var(--pb-brand-foreground)] shadow-[var(--pb-shadow-action)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-70"
      >
        {isSubmitting ? <Loader2 aria-hidden="true" className="size-5 animate-spin" strokeWidth={2} /> : <Search aria-hidden="true" className="size-5" strokeWidth={2} />}
        <span>{isSubmitting ? "Buscando disponibilidad" : "Buscar canchas"}</span>
      </button>
    </form>
  );
}
