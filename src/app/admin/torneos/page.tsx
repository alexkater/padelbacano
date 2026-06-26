"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MODULE_FLAGS } from "@/padelbacano.config";
import type { TournamentFormat, TournamentStatus } from "@/core/entities/tournament";

// ─── Response type matching API shape (entity + DB-level field) ────

type TournamentItem = {
  id: string;
  name: string;
  format: TournamentFormat;
  startDate: string;
  maxParticipants: number | null;
  level: "open" | "A" | "B" | "C";
  prize: string | null;
  status: TournamentStatus;
  entryFee: number | null;
  registrationCount: number;
};

// ─── Labels ───────────────────────────────────────────────────────

const STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: "Borrador",
  registration: "Inscripciones",
  in_progress: "En curso",
  completed: "Finalizado",
  cancelled: "Cancelado",
};

const LEVEL_LABELS: Record<string, string> = {
  open: "Open (libre)",
  A: "A (avanzado)",
  B: "B (intermedio)",
  C: "C (principiante)",
};

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: "Eliminación Directa",
  round_robin: "Round Robin",
  americano: "Americano",
  mexicano: "Mexicano",
};

type Level = "open" | "A" | "B" | "C";

const INITIAL_FORM = {
  name: "",
  format: "single_elimination" as TournamentFormat,
  startDate: "",
  maxParticipants: "",
  level: "open" as Level,
  prize: "",
  entryFee: "",
};

// ─── Component ────────────────────────────────────────────────────

export default function TournamentsAdminPage() {
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tournaments");
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const d = await res.json();
      setTournaments(d.tournaments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar torneos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.startDate) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          format: form.format,
          startDate: form.startDate,
          maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
          level: form.level,
          prize: form.prize || null,
          entryFee: form.entryFee ? Number(form.entryFee) : null,
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      setForm(INITIAL_FORM);
      await fetchTournaments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear torneo");
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Module guard ───────────────────────────────────────────────

  if (!MODULE_FLAGS.tournaments) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-pb-ink mb-6">Torneos</h1>
        <Card>
          <CardContent>
            <p className="text-sm text-pb-ink-secondary py-8 text-center">
              El modulo de torneos no esta activado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-pb-ink mb-6">Torneos</h1>

      {/* ── Create form ─────────────────────────────────────────── */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-pb-ink mb-4">
            Nuevo Torneo
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Torneo de Verano 2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="format">Formato</Label>
                <select
                  id="format"
                  value={form.format}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      format: e.target.value as TournamentFormat,
                    })
                  }
                  className="w-full h-10 rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] px-3 text-sm bg-[var(--pb-surface-primary)] text-pb-ink"
                >
                  {Object.entries(FORMAT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="startDate">Fecha inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="level">Nivel</Label>
                <select
                  id="level"
                  value={form.level}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      level: e.target.value as Level,
                    })
                  }
                  className="w-full h-10 rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] px-3 text-sm bg-[var(--pb-surface-primary)] text-pb-ink"
                >
                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="maxParticipants">Max. participantes</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min={2}
                  value={form.maxParticipants}
                  onChange={(e) =>
                    setForm({ ...form, maxParticipants: e.target.value })
                  }
                  placeholder="16"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prize">Premio</Label>
                <Input
                  id="prize"
                  value={form.prize}
                  onChange={(e) =>
                    setForm({ ...form, prize: e.target.value })
                  }
                  placeholder="Ej: $500.000 + trofeo"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting || !form.name || !form.startDate}
              >
                {submitting ? "Creando..." : "Crear Torneo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Error banner ────────────────────────────────────────── */}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-[var(--pb-radius-md)] border border-[var(--pb-status-error)]/30 bg-[var(--pb-status-error)]/5 px-4 py-3 text-sm text-[var(--pb-status-error)]"
        >
          {error}
        </div>
      )}

      {/* ── Tournament list ─────────────────────────────────────── */}
      <h2 className="text-lg font-semibold text-pb-ink mb-3">
        Torneos Creados
      </h2>

      {loading ? (
        <div className="space-y-3" aria-label="Cargando torneos">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pb-shimmer" aria-hidden="true">
                <div className="h-5 w-48 bg-[var(--pb-border-subtle)] rounded-[var(--pb-radius-sm)] mb-2" />
                <div className="h-4 w-64 bg-[var(--pb-border-subtle)] rounded-[var(--pb-radius-sm)]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tournaments.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-pb-ink-secondary py-8 text-center">
              No hay torneos creados. Usa el formulario de arriba para crear
              el primero.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Card key={t.id}>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-pb-ink truncate">
                      {t.name}
                    </p>
                    <p className="text-xs text-pb-ink-secondary mt-0.5">
                      {new Date(t.startDate).toLocaleDateString("es-ES")}
                      {" · "}
                      {FORMAT_LABELS[t.format] || t.format}
                      {" · "}
                      {LEVEL_LABELS[t.level] || t.level}
                      {" · "}
                      {t.registrationCount}/{t.maxParticipants ?? "\u221E"}{" "}
                      inscritos
                      {t.prize ? ` · Premio: ${t.prize}` : ""}
                    </p>
                  </div>
                  <Badge className="shrink-0">
                    {STATUS_LABELS[t.status] || t.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
