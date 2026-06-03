"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { MODULE_FLAGS } from "@/padelbacano.config";

type OpenMatch = {
  id: string;
  courtId: string;
  title: string | null;
  startTime: string;
  duration: number;
  minLevel: number | null;
  maxLevel: number | null;
  maxPlayers: number;
  playerCount: number;
  status: string;
  notes: string | null;
};

export function OpenMatches() {
  const [matches, setMatches] = useState<OpenMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ title: "", date: "", hour: "17", duration: "90", minLevel: "", maxLevel: "", notes: "" });
  const [message, setMessage] = useState("");

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/open-matches");
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  async function handleCreate() {
    const { title, date, hour, duration, minLevel, maxLevel, notes } = formData;
    if (!date || !hour) return;
    const startTime = new Date(`${date}T${hour}:00:00`);
    try {
      const res = await fetch("/api/open-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: "any", title: title || null, startTime: startTime.toISOString(),
          duration: parseInt(duration), minLevel: minLevel ? parseInt(minLevel) : null,
          maxLevel: maxLevel ? parseInt(maxLevel) : null, maxPlayers: 4, notes: notes || null,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setMessage("¡Partido creado!");
        setTimeout(() => setMessage(""), 3000);
        fetchMatches();
      }
    } catch { /* ignore */ }
  }

  async function handleJoin(matchId: string) {
    try {
      await fetch(`/api/open-matches/${matchId}/join`, { method: "POST" });
      setMessage("¡Te has unido al partido!");
      setTimeout(() => setMessage(""), 3000);
      fetchMatches();
    } catch { /* ignore */ }
  }

  if (!MODULE_FLAGS.social) return null;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--club-ink)]">Partidos Abiertos</h2>
          <p className="text-sm text-[var(--club-ink-muted)]">Únete a un partido o crea el tuyo</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Crear Partido</Button>
      </div>

      {message && (
        <div className="mb-4 px-4 py-2 rounded-[var(--club-radius)] bg-[var(--club-primary)]/10 text-[var(--club-primary)] text-sm font-medium">{message}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2].map(i => <Card key={i} className="animate-pulse"><CardContent><div className="h-16" /></CardContent></Card>)}
        </div>
      ) : matches.length === 0 ? (
        <Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">No hay partidos abiertos. ¡Crea el primero!</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {matches.map(m => (
            <Card key={m.id}>
              <CardContent>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[var(--club-ink)]">{m.title || "Partido de pádel"}</p>
                    <p className="text-xs text-[var(--club-ink-muted)] mt-1">
                      {new Date(m.startTime).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                      {" · "}
                      {new Date(m.startTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                      {" · "}{m.duration} min
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">{m.playerCount}/{m.maxPlayers} jugadores</Badge>
                      {m.minLevel && <Badge variant="outline" className="text-xs">Nivel {m.minLevel}-{m.maxLevel}</Badge>}
                    </div>
                    {m.notes && <p className="text-xs text-[var(--club-ink-muted)] mt-1">{m.notes}</p>}
                  </div>
                  <Button size="sm" onClick={() => handleJoin(m.id)} disabled={m.playerCount >= m.maxPlayers}>
                    {m.playerCount >= m.maxPlayers ? "Lleno" : "Unirse"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--club-ink)] mb-4">Crear Partido Abierto</h2>
          <div className="space-y-3 mb-6">
            <div className="space-y-1"><Label>Título (opcional)</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ej: Partido nivel medio" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Fecha</Label><Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} min={today} /></div>
              <div className="space-y-1"><Label>Hora</Label><select value={formData.hour} onChange={e => setFormData({...formData, hour: e.target.value})} className="w-full h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 text-sm bg-white">
                {Array.from({length: 14}, (_,i) => i+9).map(h => <option key={h} value={h}>{h}:00</option>)}
              </select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Duración</Label><select value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 text-sm bg-white"><option value="60">60 min</option><option value="90">90 min</option></select></div>
              <div className="space-y-1"><Label>Nivel (opcional)</Label><div className="flex gap-2"><select value={formData.minLevel} onChange={e => setFormData({...formData, minLevel: e.target.value})} className="flex-1 h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-2 text-sm bg-white"><option value="">Mín</option>{[1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select><select value={formData.maxLevel} onChange={e => setFormData({...formData, maxLevel: e.target.value})} className="flex-1 h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-2 text-sm bg-white"><option value="">Máx</option>{[1,2,3,4,5,6,7].map(n=><option key={n} value={n}>{n}</option>)}</select></div></div>
            </div>
            <div className="space-y-1"><Label>Notas (opcional)</Label><textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full min-h-[60px] rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 py-2 text-sm bg-white" rows={2} /></div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleCreate} disabled={!formData.date}>Crear Partido</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
