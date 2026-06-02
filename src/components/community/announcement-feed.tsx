import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: "¡Campeones de Andalucía!", content: "Nuestro equipo se proclama campeón en 1ª Categoría. ¡Enhorabuena a Ignacio, Álvaro, Franco, Laura, Beatriz y todo el equipo!", date: "28 Feb 2026", type: "torneo" },
  { id: 2, title: "Nuevos horarios de escuela", content: "La escuela de pádel amplía horarios. Clases para todos los niveles de lunes a sábado. ¡Pregunta por WhatsApp!", date: "15 Mar 2026", type: "escuela" },
  { id: 3, title: "Torneo interno este sábado", content: "Apúntate al torneo interno del club. Niveles 3-5. Premio: 1 mes de socio gratis. Plazas limitadas.", date: "10 Abr 2026", type: "torneo" },
];

const typeStyles: Record<string, string> = {
  torneo: "bg-[var(--club-warning-bg)] text-[var(--club-warning)]",
  escuela: "bg-[var(--club-primary)]/10 text-[var(--club-primary)]",
  general: "bg-[var(--club-primary)]/10 text-[var(--club-primary)]",
};

export function AnnouncementFeed() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-20">
      <h2 className="text-3xl font-bold text-[var(--club-ink)] mb-8">Noticias del Club</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MOCK_ANNOUNCEMENTS.map((a) => (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={typeStyles[a.type] || typeStyles.general}>
                  {a.type}
                </Badge>
                <span className="text-xs text-[var(--club-ink-muted)]">{a.date}</span>
              </div>
              <CardTitle className="text-base mb-2">{a.title}</CardTitle>
              <p className="text-sm text-[var(--club-ink-muted)]">{a.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
