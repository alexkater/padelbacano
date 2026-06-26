"use client";

import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Clock, Layers, PanelsTopLeft, SlidersHorizontal } from "lucide-react";

export const COURT_TYPE_VALUES = ["all", "glass", "panoramic", "wall"] as const;
export const VENUE_VALUES = ["all", "indoor", "outdoor"] as const;

export type CourtTypeValue = (typeof COURT_TYPE_VALUES)[number];
export type VenueValue = (typeof VENUE_VALUES)[number];

export type AdvancedSearchFiltersProps = {
  readonly courtType: CourtTypeValue;
  readonly endTime: string;
  readonly maxPriceCop: string;
  readonly minPriceCop: string;
  readonly onCourtTypeChange: (value: CourtTypeValue) => void;
  readonly onEndTimeChange: (value: string) => void;
  readonly onMaxPriceCopChange: (value: string) => void;
  readonly onMinPriceCopChange: (value: string) => void;
  readonly onStartTimeChange: (value: string) => void;
  readonly onVenueChange: (value: VenueValue) => void;
  readonly startTime: string;
  readonly venue: VenueValue;
};

const COURT_TYPE_LABELS: Record<CourtTypeValue, string> = {
  all: "Todas",
  glass: "Cristal",
  panoramic: "Panorámica",
  wall: "Muro",
};

const VENUE_LABELS: Record<VenueValue, string> = {
  all: "Indoor y outdoor",
  indoor: "Indoor",
  outdoor: "Outdoor",
};

function isCourtTypeValue(value: string): value is CourtTypeValue {
  return COURT_TYPE_VALUES.some((courtType) => courtType === value);
}

function isVenueValue(value: string): value is VenueValue {
  return VENUE_VALUES.some((venue) => venue === value);
}

function filterSelectClassName(): string {
  return "inline-flex min-h-11 w-full items-center justify-between gap-[var(--pb-space-3)] rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] py-[var(--pb-space-3)] text-sm font-medium text-[var(--pb-text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--pb-brand-primary)] focus:ring-[var(--pb-ring-focus)]";
}

export function AdvancedSearchSection(props: AdvancedSearchFiltersProps) {
  return (
    <details className="group mt-[var(--pb-space-4)] rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] open:bg-[var(--pb-surface-secondary)]">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-[var(--pb-space-3)] px-[var(--pb-space-4)] py-[var(--pb-space-3)] text-sm font-bold text-[var(--pb-text-primary)] outline-none transition-[background-color] marker:hidden focus-visible:shadow-[var(--pb-ring-focus)] [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-[var(--pb-space-2)]">
          <SlidersHorizontal aria-hidden="true" className="size-5 text-[var(--pb-brand-primary)]" strokeWidth={2} />
          Más filtros
        </span>
        <ChevronDown aria-hidden="true" className="size-5 text-[var(--pb-text-secondary)] transition-transform group-open:rotate-180" strokeWidth={2} />
      </summary>
      <div className="px-[var(--pb-space-3)] pb-[var(--pb-space-3)] md:px-[var(--pb-space-4)] md:pb-[var(--pb-space-4)]">
        <AdvancedSearchFilters {...props} />
      </div>
    </details>
  );
}

export function AdvancedSearchFilters({
  courtType,
  endTime,
  maxPriceCop,
  minPriceCop,
  onCourtTypeChange,
  onEndTimeChange,
  onMaxPriceCopChange,
  onMinPriceCopChange,
  onStartTimeChange,
  onVenueChange,
  startTime,
  venue,
}: AdvancedSearchFiltersProps) {
  return (
    <div className="grid gap-[var(--pb-space-4)] rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-secondary)] p-[var(--pb-space-4)] md:grid-cols-2">
      <div>
        <Label.Root htmlFor="price-min-cop" className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]">
          Precio mínimo COP
        </Label.Root>
        <input
          id="price-min-cop"
          inputMode="numeric"
          min="0"
          pattern="[0-9]*"
          placeholder="Ej. 60000"
          type="number"
          value={minPriceCop}
          onChange={(event) => onMinPriceCopChange(event.target.value)}
          className="min-h-11 w-full rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] py-[var(--pb-space-3)] text-sm text-[var(--pb-text-primary)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--pb-text-tertiary)] focus:border-[var(--pb-brand-primary)] focus:ring-[var(--pb-ring-focus)]"
        />
      </div>

      <div>
        <Label.Root htmlFor="price-max-cop" className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]">
          Precio máximo COP
        </Label.Root>
        <input
          id="price-max-cop"
          inputMode="numeric"
          min="0"
          pattern="[0-9]*"
          placeholder="Ej. 120000"
          type="number"
          value={maxPriceCop}
          onChange={(event) => onMaxPriceCopChange(event.target.value)}
          className="min-h-11 w-full rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] py-[var(--pb-space-3)] text-sm text-[var(--pb-text-primary)] outline-none transition-[border-color,box-shadow] placeholder:text-[var(--pb-text-tertiary)] focus:border-[var(--pb-brand-primary)] focus:ring-[var(--pb-ring-focus)]"
        />
      </div>

      <div>
        <Label.Root className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]" id="court-type-filter-label">
          Tipo de cancha
        </Label.Root>
        <Select.Root value={courtType} onValueChange={(value) => isCourtTypeValue(value) && onCourtTypeChange(value)}>
          <Select.Trigger aria-labelledby="court-type-filter-label" className={filterSelectClassName()}>
            <span className="inline-flex items-center gap-[var(--pb-space-2)]">
              <Layers aria-hidden="true" className="size-5 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
              <Select.Value />
            </span>
            <Select.Icon>
              <ChevronDown aria-hidden="true" className="size-4 text-[var(--pb-text-secondary)]" strokeWidth={2} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 overflow-hidden rounded-[var(--pb-radius-md)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-elevated)] p-[var(--pb-space-2)] text-[var(--pb-text-primary)] shadow-[var(--pb-shadow-overlay)]">
              <Select.Viewport>
                {COURT_TYPE_VALUES.map((value) => (
                  <Select.Item key={value} value={value} className="relative flex min-h-11 cursor-pointer select-none items-center rounded-[var(--pb-radius-sm)] py-[var(--pb-space-2)] pl-[var(--pb-space-8)] pr-[var(--pb-space-3)] text-sm outline-none data-[highlighted]:bg-[var(--pb-surface-secondary)] data-[highlighted]:text-[var(--pb-text-primary)]">
                    <Select.ItemIndicator className="absolute left-[var(--pb-space-2)] inline-flex items-center text-[var(--pb-brand-primary)]">
                      <Check aria-hidden="true" className="size-4" strokeWidth={2} />
                    </Select.ItemIndicator>
                    <Select.ItemText>{COURT_TYPE_LABELS[value]}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      <div>
        <Label.Root className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]" id="venue-filter-label">
          Cubierta
        </Label.Root>
        <Select.Root value={venue} onValueChange={(value) => isVenueValue(value) && onVenueChange(value)}>
          <Select.Trigger aria-labelledby="venue-filter-label" className={filterSelectClassName()}>
            <span className="inline-flex items-center gap-[var(--pb-space-2)]">
              <PanelsTopLeft aria-hidden="true" className="size-5 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
              <Select.Value />
            </span>
            <Select.Icon>
              <ChevronDown aria-hidden="true" className="size-4 text-[var(--pb-text-secondary)]" strokeWidth={2} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="z-50 overflow-hidden rounded-[var(--pb-radius-md)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-elevated)] p-[var(--pb-space-2)] text-[var(--pb-text-primary)] shadow-[var(--pb-shadow-overlay)]">
              <Select.Viewport>
                {VENUE_VALUES.map((value) => (
                  <Select.Item key={value} value={value} className="relative flex min-h-11 cursor-pointer select-none items-center rounded-[var(--pb-radius-sm)] py-[var(--pb-space-2)] pl-[var(--pb-space-8)] pr-[var(--pb-space-3)] text-sm outline-none data-[highlighted]:bg-[var(--pb-surface-secondary)] data-[highlighted]:text-[var(--pb-text-primary)]">
                    <Select.ItemIndicator className="absolute left-[var(--pb-space-2)] inline-flex items-center text-[var(--pb-brand-primary)]">
                      <Check aria-hidden="true" className="size-4" strokeWidth={2} />
                    </Select.ItemIndicator>
                    <Select.ItemText>{VENUE_LABELS[value]}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      <div>
        <Label.Root htmlFor="time-start" className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]">
          Hora desde
        </Label.Root>
        <div className="relative">
          <Clock aria-hidden="true" className="pointer-events-none absolute left-[var(--pb-space-3)] top-1/2 size-5 -translate-y-1/2 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
          <input id="time-start" type="time" value={startTime} onChange={(event) => onStartTimeChange(event.target.value)} className="min-h-11 w-full rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] py-[var(--pb-space-3)] pl-[var(--pb-space-10)] pr-[var(--pb-space-3)] text-sm text-[var(--pb-text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--pb-brand-primary)] focus:ring-[var(--pb-ring-focus)]" />
        </div>
      </div>

      <div>
        <Label.Root htmlFor="time-end" className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]">
          Hora hasta
        </Label.Root>
        <div className="relative">
          <Clock aria-hidden="true" className="pointer-events-none absolute left-[var(--pb-space-3)] top-1/2 size-5 -translate-y-1/2 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
          <input id="time-end" type="time" value={endTime} onChange={(event) => onEndTimeChange(event.target.value)} className="min-h-11 w-full rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] py-[var(--pb-space-3)] pl-[var(--pb-space-10)] pr-[var(--pb-space-3)] text-sm text-[var(--pb-text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--pb-brand-primary)] focus:ring-[var(--pb-ring-focus)]" />
        </div>
      </div>
    </div>
  );
}
