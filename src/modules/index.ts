// ─── Module system — feature flag gate ──────────────────────────────────────
// Each module is only available if enabled in MODULE_FLAGS.
// Components import from here to get conditional module access.

import { MODULE_FLAGS } from "@/padelbacano.config";

/** All available modules and their enabled state */
export const MODULES = {
  social: {
    enabled: MODULE_FLAGS.social,
    /** Lazy-loaded social module */
    get components() {
      if (!MODULE_FLAGS.social) return null;
      return import("./social/components");
    },
  },
  tournaments: {
    enabled: MODULE_FLAGS.tournaments,
  },
  payments: {
    enabled: MODULE_FLAGS.payments,
  },
  loyalty: {
    enabled: MODULE_FLAGS.loyalty,
  },
  school: {
    enabled: MODULE_FLAGS.school,
  },
  analytics: {
    enabled: MODULE_FLAGS.analytics,
  },
  invoicing: {
    enabled: MODULE_FLAGS.invoicing,
  },
} as const;

/** Helper: check if a module is enabled */
export function isModuleEnabled(module: keyof typeof MODULES): boolean {
  return MODULES[module].enabled;
}
