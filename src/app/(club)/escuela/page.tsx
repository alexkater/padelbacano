"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Coach = { id: string; name: string; bio: string | null; specialties: string[] };
type ClassItem = {
  id: string; name: string; description: string | null; type: string;
  level: number | null; maxStudents: number; price: number;
  schedule: { daysOfWeek: number[]; startHour: number; endHour: number };
};

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const TYPE_LABELS: Record<string, string> = { group: "Grupo", private: "Privada", clinic: "Clinic", kids: "Infantil" };

export default function SchoolPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [cRes, clRes] = await Promise.all([fetch("/api/coaches"), fetch("/api/classes")]);
        if (cRes.ok) { const d = await cRes.json(); setCoaches(d.coaches); }
        if (clRes.ok) { const d = await clRes.json(); setClasses(d.classes); }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-64" /><div className="h-4 bg-gray-200 rounded w-96" /></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-2">Escuela de Pádel</h1>
      <p className="text-sm text-[var(--club-ink-muted)] mb-8">Clases para todos los niveles con los mejores profesionales</p>

      {/* Coaches */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-[var(--club-ink)] mb-4">Nuestros Entrenadores</h2>
        {coaches.length === 0 ? (
          <Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">Próximamente anunciaremos nuestro equipo de entrenadores.</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coaches.map(c => (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--club-primary)]/10 flex items-center justify-center text-lg font-bold text-[var(--club-primary)]">{c.name.charAt(0)}</div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {c.bio && <p className="text-sm text-[var(--club-ink-muted)] mb-3">{c.bio}</p>}
                  <div className="flex flex-wrap gap-1">
                    {c.specialties.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Classes */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--club-ink)] mb-4">Clases Disponibles</h2>
        {classes.length === 0 ? (
          <Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">No hay clases programadas en este momento. ¡Vuelve pronto!</p></CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map(cl => (
              <Card key={cl.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{cl.name}</CardTitle>
                    <Badge>{TYPE_LABELS[cl.type] || cl.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {cl.description && <p className="text-sm text-[var(--club-ink-muted)] mb-3">{cl.description}</p>}
                  <div className="space-y-1 text-sm">
                    <p className="text-[var(--club-ink-muted)]">
                      🕐 {cl.schedule.daysOfWeek.map((d: number) => DAY_NAMES[d]).join(", ")}
                      {" · "}{cl.schedule.startHour}:00 - {cl.schedule.endHour}:00
                    </p>
                    {cl.level && <p className="text-[var(--club-ink-muted)]">🎯 Nivel {cl.level}/7</p>}
                    <p className="text-[var(--club-ink-muted)]">👥 Máx. {cl.maxStudents} alumnos</p>
                    <p className="font-semibold text-[var(--club-primary)]">{(cl.price / 100).toFixed(2)} €/sesión</p>
                  </div>
                  <Button size="sm" className="mt-3 w-full">Inscribirse</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
