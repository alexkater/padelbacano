// ─── UUID helper (no extra deps) ───────────────────────────────────────────

// Edge-compatible UUID v4 generator. No crypto polyfill needed on Node 19+.
export const v4 = (): string => crypto.randomUUID();

export function uuid(): string {
  return crypto.randomUUID();
}
