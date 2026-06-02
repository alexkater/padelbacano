import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PartnerBoardPage() {
  const posts = [
    { id: 1, name: "Carlos R.", level: 4, schedule: "Jueves y viernes tarde", notes: "Busco partido nivel medio. Juego de drive.", posted: "Hace 2h" },
    { id: 2, name: "Laura M.", level: 3, schedule: "Mañanas entre semana", notes: "Nivel iniciación-medio. Prefiero pista panorámica.", posted: "Hace 5h" },
    { id: 3, name: "Pablo S.", level: 5, schedule: "Fines de semana", notes: "Busco revés para torneo interno del club.", posted: "Ayer" },
    { id: 4, name: "Ana D.", level: 2, schedule: "Lunes y miércoles 18:00", notes: "Estoy empezando, busco gente con paciencia para mejorar.", posted: "Ayer" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">Busco Compañero/a</h1>
          <p className="text-sm text-[var(--club-ink-muted)] mt-1">
            Encuentra gente de tu nivel para jugar al pádel
          </p>
        </div>
        <button className="px-4 py-2 bg-[var(--club-primary)] text-white rounded-[var(--club-radius)] text-sm font-medium cursor-pointer hover:opacity-90">
          + Publicar Anuncio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[var(--club-primary)]/10 flex items-center justify-center text-sm font-bold text-[var(--club-primary)]">
                    {post.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{post.name}</CardTitle>
                    <p className="text-xs text-[var(--club-ink-muted)]">{post.posted}</p>
                  </div>
                </div>
                <Badge variant="outline">Nivel {post.level}/7</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[var(--club-ink)] mb-3">{post.notes}</p>
              <div className="flex items-center gap-2 text-xs text-[var(--club-ink-muted)]">
                <span>🕐 {post.schedule}</span>
              </div>
              <button className="mt-3 w-full py-2 border border-[var(--club-primary)] text-[var(--club-primary)] rounded-[var(--club-radius)] text-sm font-medium hover:bg-[var(--club-primary)]/5 transition-colors cursor-pointer">
                Contactar
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
