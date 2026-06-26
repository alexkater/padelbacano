// ─── Toggle Switch ─────────────────────────────────────────────────────────
//
// Simple accessible toggle switch. Follows the visual style of the existing
// shadcn-inspired component set without requiring @radix-ui/react-switch.

"use client";

import { useId } from "react";

type SwitchProps = {
  readonly checked: boolean;
  readonly onToggle: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly id?: string;
};

export function Switch({ checked, onToggle, disabled, id: externalId }: SwitchProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;

  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onToggle(!checked)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "border-2 border-transparent transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-primary)] focus-visible:ring-offset-2",
        checked ? "bg-[var(--club-primary)]" : "bg-gray-200",
        disabled ? "opacity-50 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0",
          "transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}
