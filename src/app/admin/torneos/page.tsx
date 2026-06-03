"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { MODULE_FLAGS } from "@/padelbacano.config";

type Tournament = { id: string; name: string; format: string; startDate: string; status: string; registrationCount: number; maxParticipants: number | null };
const STATUS_LABELS: Record<string, string> = { draft: "Borrador", registration: "Inscripciones", in_progress: "En curso", completed: "Finalizado", cancelled: "Cancelado" };

export default function TournamentsAdminPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", format: "single_elimination", startDate: "", entryFee: "", maxParticipants: "", description: "" });

  const fetchTournaments = useCallback(async () => {
    try { const res = await fetch("/api/tournaments"); if (res.ok) { const d = await res.json(); setTournaments(d.tournaments); } } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  async function handleCreate() {
    if (!form.name || !form.startDate) return;
    await fetch("/api/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowCreate(false); fetchTournaments();
  }

  if (!MODULE_FLAGS.tournaments) {
    return <div className="max-w-2xl"><h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Torneos</h1><Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">El módulo de torneos no está activado.</p></CardContent></Card></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--club-ink)]">Torneos</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Nuevo Torneo</Button>
      </div>

      {loading ? <div className="animate-pulse"><div className="h-16 bg-gray-200 rounded mb-3" /></div> : tournaments.length === 0 ? (
        <Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">No hay torneos. ¡Crea el primero!</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {tournaments.map(t => (
            <Card key={t.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-[var(--club-ink)]">{t.name}</p>
                    <p className="text-xs text-[var(--club-ink-muted)]">{new Date(t.startDate).toLocaleDateString("es-ES")} · {t.format} · {t.registrationCount}/{t.maxParticipants || "∞"} inscritos</p>
                  </div>
                  <Badge>{STATUS_LABELS[t.status] || t.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <div><h2 className="text-lg font-semibold mb-4">Nuevo Torneo</h2>
          <div className="space-y-3 mb-6">
            <div className="space-y-1"><Label>Nombre</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ej: Torneo de Verano 2026" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Formato</Label><select value={form.format} onChange={e => setForm({...form, format: e.target.value})} className="w-full h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 text-sm bg-white"><option value="single_elimination">Eliminación Directa</option><option value="round_robin">Round Robin</option><option value="americano">Americano</option><option value="mexicano">Mexicano</option></select></div>
              <div className="space-y-1"><Label>Fecha inicio</Label><Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Inscripción (COP, 0 = gratis)</Label><Input type="number" value={form.entryFee} onChange={e => setForm({...form, entryFee: e.target.value})} placeholder="50000" /></div>
              <div className="space-y-1"><Label>Máx. participantes</Label><Input type="number" value={form.maxParticipants} onChange={e => setForm({...form, maxParticipants: e.target.value})} placeholder="16" /></div>
            </div>
          </div>
          <div className="flex gap-3"><Button className="flex-1" onClick={handleCreate}>Crear Torneo</Button><Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button></div>
        </div>
      </Dialog>
    </div>
  );
}
