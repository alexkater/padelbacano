"use client";
import { CLUB_CONFIG } from "@/padelbacano.config";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ContentEditorPage() {
  const [heroTitle, setHeroTitle] = useState("El Remate Padel Club");
  const [heroSubtitle, setHeroSubtitle] = useState("Tu club de pádel en Sevilla");
  const [heroDescription, setHeroDescription] = useState("11 pistas indoor de cristal cubiertas. Escuela de pádel, torneos y partidos nivelados todos los días.");
  const [about, setAbout] = useState("");
  const [prices, setPrices] = useState("No socios: 12 €/persona (90 min). Socios: 8 €/persona (90 min).");
  const [openingHours, setOpeningHours] = useState("Lunes a domingo de 9:00 a 00:00");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/club/" + CLUB_CONFIG.slug + "/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hero: { title: heroTitle, subtitle: heroSubtitle, description: heroDescription },
          about,
          prices,
          openingHours,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Save failed", err);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Contenido del Club</h1>
      <p className="text-sm text-[var(--club-ink-muted)] mb-6">
        Edita el texto que aparece en la página pública del club. Los cambios se ven al instante.
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hero</CardTitle>
            <CardDescription>La primera sección que ve el visitante</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subtítulo</Label>
              <Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <textarea
                value={heroDescription}
                onChange={(e) => setHeroDescription(e.target.value)}
                className="w-full min-h-[80px] rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 py-2 text-sm bg-white"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sobre el Club</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full min-h-[100px] rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 py-2 text-sm bg-white"
              rows={4}
              placeholder="Describe las instalaciones..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precios</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={prices}
              onChange={(e) => setPrices(e.target.value)}
              className="w-full min-h-[80px] rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 py-2 text-sm bg-white"
              rows={3}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horario</CardTitle>
          </CardHeader>
          <CardContent>
            <Input value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          {saved && <span className="text-sm text-[var(--club-primary)] font-medium">✓ Contenido actualizado</span>}
        </div>
      </div>
    </div>
  );
}
