"use client";
import { CLUB_CONFIG } from "@/padelbacano.config";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PoliciesPage() {
  const [minHours, setMinHours] = useState("6");
  const [penaltyPercent, setPenaltyPercent] = useState("50");
  const [allowRefund, setAllowRefund] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/club/" + CLUB_CONFIG.slug + "/policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancellationPolicy: {
            minHoursBefore: parseInt(minHours),
            penaltyPercent: parseInt(penaltyPercent),
            allowRefund,
          },
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Políticas</h1>
      <p className="text-sm text-[var(--club-ink-muted)] mb-6">
        Configura las reglas de cancelación y reembolso del club.
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Política de Cancelación</CardTitle>
            <CardDescription>Los usuarios verán estas condiciones antes de reservar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Horas mínimas para cancelar sin coste</Label>
              <Input type="number" value={minHours} onChange={(e) => setMinHours(e.target.value)} min="0" max="72" />
              <p className="text-xs text-[var(--club-ink-muted)]">El usuario puede cancelar gratis hasta {minHours}h antes de la reserva</p>
            </div>
            <div className="space-y-2">
              <Label>Penalización por cancelación tardía (%)</Label>
              <Input type="number" value={penaltyPercent} onChange={(e) => setPenaltyPercent(e.target.value)} min="0" max="100" />
              <p className="text-xs text-[var(--club-ink-muted)]">Porcentaje del precio que se retiene si cancela fuera de plazo</p>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="refund" checked={allowRefund} onChange={(e) => setAllowRefund(e.target.checked)} className="rounded" />
              <Label htmlFor="refund">Permitir reembolso automático</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          {saved && <span className="text-sm text-[var(--club-primary)] font-medium">✓ Políticas actualizadas</span>}
        </div>
      </div>
    </div>
  );
}
