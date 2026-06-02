import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock player stats — will be replaced by API when auth/profile is wired
const MOCK_STATS = {
  displayName: "Alejandro G.",
  level: 5,
  totalBookings: 47,
  thisMonth: 12,
  favoriteCourt: "Pista 3",
  favoriteHour: "17:00",
  streak: 8,
  frequentPartners: ["María L.", "Carlos R.", "Pablo S."],
  recentBookings: [
    { date: "21 May", court: "Pista 3", time: "17:00", duration: 90 },
    { date: "19 May", court: "Pista 1", time: "16:00", duration: 60 },
    { date: "18 May", court: "Pista 2", time: "18:00", duration: 90 },
    { date: "16 May", court: "Pista 5", time: "14:00", duration: 60 },
    { date: "15 May", court: "Pista 3", time: "17:00", duration: 90 },
    { date: "14 May", court: "Pista 4", time: "19:00", duration: 90 },
    { date: "13 May", court: "Pista 3", time: "17:00", duration: 90 },
    { date: "12 May", court: "Pista 1", time: "10:00", duration: 60 },
  ],
};

export default function ProfilePage() {
  const s = MOCK_STATS;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-[var(--club-primary)] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
          {s.displayName.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">{s.displayName}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="default">Nivel {s.level}/7</Badge>
            <span className="text-sm text-[var(--club-ink-muted)]">Racha: {s.streak} días seguidos</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total partidos", value: s.totalBookings },
          { label: "Este mes", value: s.thisMonth },
          { label: "Pista favorita", value: s.favoriteCourt },
          { label: "Hora favorita", value: s.favoriteHour },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-xs text-[var(--club-ink-muted)]">{stat.label}</p>
              <p className="text-2xl font-bold text-[var(--club-ink)] mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Frequent partners */}
        <Card>
          <CardHeader><CardTitle>Compañeros Frecuentes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {s.frequentPartners.map((name, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-[var(--club-surface-alt)] flex items-center justify-center text-xs font-medium text-[var(--club-ink)]">
                    {name.charAt(0)}
                  </div>
                  {name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent bookings */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Últimos Partidos</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]">
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium">Pista</th>
                  <th className="py-2 font-medium">Hora</th>
                  <th className="py-2 font-medium">Dur.</th>
                </tr>
              </thead>
              <tbody>
                {s.recentBookings.map((b, i) => (
                  <tr key={i} className="border-b border-[var(--club-border)] last:border-0">
                    <td className="py-2 text-[var(--club-ink)]">{b.date}</td>
                    <td className="py-2 text-[var(--club-ink)]">{b.court}</td>
                    <td className="py-2 text-[var(--club-ink-muted)]">{b.time}</td>
                    <td className="py-2 text-[var(--club-ink-muted)]">{b.duration} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Referral — coming soon */}
      <Card className="mt-6 opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Código de Referido
            <Badge variant="outline">Próximamente</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--club-ink-muted)]">
            Invita a tus amigos y consigue descuentos mutuos. Disponible pronto.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
