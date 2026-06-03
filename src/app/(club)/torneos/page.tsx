"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MODULE_FLAGS } from "@/padelbacano.config";

type Tournament = { id: string; name: string; description: string | null; format: string; startDate: string; status: string; registrationCount: number; maxParticipants: number | null; entryFee: number | null; minLevel: number | null; maxLevel: number | null; prize: string | null };

const FORMAT_LABELS: Record<string, string> = { single_elimination: "Eliminación Directa", round_robin: "Round Robin", americano: "Americano", mexicano: "Mexicano" };

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { async function load() { try { const res = await fetch("/api/tournaments"); if (res.ok) { const d = await res.json(); setTournaments(d.tournaments); } } catch { } setLoading(false); } load(); }, []);

  async function handleRegister(id: string) { await fetch(`/api/tournaments/${id}/register`, { method: "POST" }); const res = await fetch("/api/tournaments"); if (res.ok) { const d = await res.json(); setTournaments(d.tournaments); } }

  if (!MODULE_FLAGS.tournaments) return <div className="max-w-6xl mx-auto px-4 py-8"><Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">El módulo de torneos no está disponible en este club.</p></CardContent></Card></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-2">Torneos</h1>
      <p className="text-sm text-[var(--club-ink-muted)] mb-8">Participa en los torneos del club y demuestra tu nivel</p>

      {loading ? <div className="animate-pulse space-y-3">{ [1,2].map(i => <div key={i} className="h-24 bg-gray-200 rounded" />) }</div> :
       tournaments.length === 0 ? <Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">No hay torneos programados. ¡Vuelve pronto!</p></CardContent></Card> :
       <div className="space-y-4">
        {tournaments.map(t => (
          <Card key={t.id}>
            <CardHeader><div className="flex items-center justify-between"><CardTitle>{t.name}</CardTitle><Badge>{FORMAT_LABELS[t.format] || t.format}</Badge></div></CardHeader>
            <CardContent>
              {t.description && <p className="text-sm text-[var(--club-ink-muted)] mb-3">{t.description}</p>}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-[var(--club-ink-muted)]">Fecha</p><p className="font-medium">{new Date(t.startDate).toLocaleDateString("es-ES")}</p></div>
                <div><p className="text-[var(--club-ink-muted)]">Inscritos</p><p className="font-medium">{t.registrationCount}/{t.maxParticipants || "∞"}</p></div>
                {t.entryFee ? <div><p className="text-[var(--club-ink-muted)]">Inscripción</p><p className="font-medium text-[var(--club-primary)]">${(t.entryFee / 100).toLocaleString("es-CO")} COP</p></div> : <div><p className="text-[var(--club-ink-muted)]">Inscripción</p><p className="font-medium text-green-600">Gratis</p></div>}
                {t.minLevel && <div><p className="text-[var(--club-ink-muted)]">Nivel</p><p className="font-medium">{t.minLevel}-{t.maxLevel}/7</p></div>}
              </div>
              {t.prize && <p className="text-sm mt-3"><span className="font-medium">🏆 Premio:</span> {t.prize}</p>}
              <Button size="sm" className="mt-3" onClick={() => handleRegister(t.id)} disabled={t.status !== "registration" && t.status !== "draft"}>Inscribirse</Button>
            </CardContent>
          </Card>
        ))}
      </div>}
    </div>
  );
}
