import { Badge } from "@/components/ui/badge";

export function ChatComingSoon() {
  return (
    <div className="border border-dashed border-[var(--club-border)] rounded-[var(--club-radius-lg)] p-6 text-center opacity-60 hover:opacity-80 transition-opacity">
      <p className="text-lg font-semibold text-[var(--club-ink)] mb-1">Chat del Partido</p>
      <Badge variant="outline" className="mb-2">Próximamente</Badge>
      <p className="text-sm text-[var(--club-ink-muted)]">
        Chatea con tus compañeros de pista antes del partido. Disponible pronto.
      </p>
    </div>
  );
}
