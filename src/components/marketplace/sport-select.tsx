"use client";

import * as Label from "@radix-ui/react-label";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, Trophy } from "lucide-react";

export const SPORT_VALUES = ["all", "padel", "tenis"] as const;

export type SportValue = (typeof SPORT_VALUES)[number];

const SPORT_LABELS: Record<SportValue, string> = {
  all: "Todos",
  padel: "Pádel",
  tenis: "Tenis",
};

function isSportValue(value: string): value is SportValue {
  return SPORT_VALUES.some((sport) => sport === value);
}

type SportSelectProps = {
  readonly labelId: string;
  readonly value: SportValue;
  readonly onValueChange: (value: SportValue) => void;
};

export function SportSelect({ labelId, value, onValueChange }: SportSelectProps) {
  return (
    <div className="md:col-span-2">
      <Label.Root id={labelId} className="mb-[var(--pb-space-2)] block text-sm font-semibold text-[var(--pb-text-primary)]">
        Deporte
      </Label.Root>
      <Select.Root
        value={value}
        onValueChange={(nextValue) => {
          if (isSportValue(nextValue)) {
            onValueChange(nextValue);
          }
        }}
      >
        <Select.Trigger
          aria-labelledby={labelId}
          className="inline-flex min-h-11 w-full items-center justify-between gap-[var(--pb-space-3)] rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] py-[var(--pb-space-3)] text-sm font-medium text-[var(--pb-text-primary)] outline-none transition-[border-color,box-shadow] focus:border-[var(--pb-brand-primary)] focus:ring-[var(--pb-ring-focus)]"
        >
          <span className="inline-flex items-center gap-[var(--pb-space-2)]">
            <Trophy aria-hidden="true" className="size-5 text-[var(--pb-text-tertiary)]" strokeWidth={2} />
            <Select.Value />
          </span>
          <Select.Icon>
            <ChevronDown aria-hidden="true" className="size-4 text-[var(--pb-text-secondary)]" strokeWidth={2} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="z-50 overflow-hidden rounded-[var(--pb-radius-md)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-elevated)] p-[var(--pb-space-2)] text-[var(--pb-text-primary)] shadow-[var(--pb-shadow-overlay)]">
            <Select.Viewport>
              {SPORT_VALUES.map((sportValue) => (
                <Select.Item
                  key={sportValue}
                  value={sportValue}
                  className="relative flex min-h-11 cursor-pointer select-none items-center rounded-[var(--pb-radius-sm)] py-[var(--pb-space-2)] pl-[var(--pb-space-8)] pr-[var(--pb-space-3)] text-sm outline-none data-[highlighted]:bg-[var(--pb-surface-secondary)] data-[highlighted]:text-[var(--pb-text-primary)]"
                >
                  <Select.ItemIndicator className="absolute left-[var(--pb-space-2)] inline-flex items-center text-[var(--pb-brand-primary)]">
                    <Check aria-hidden="true" className="size-4" strokeWidth={2} />
                  </Select.ItemIndicator>
                  <Select.ItemText>{SPORT_LABELS[sportValue]}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
