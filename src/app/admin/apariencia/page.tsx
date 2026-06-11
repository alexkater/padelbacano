"use client";
import { CLUB_CONFIG } from "@/padelbacano.config";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AppearancePage() {
  const [primaryColor, setPrimaryColor] = useState("#1a3a2a");
  const [surfaceColor, setSurfaceColor] = useState("#d4eaf7");
  const [fontFamily, setFontFamily] = useState("Saira");
  const [borderRadius, setBorderRadius] = useState<"none" | "sm" | "md" | "lg">("md");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const root = document.documentElement;
    root.style.setProperty("--club-primary", primaryColor);
    root.style.setProperty("--club-surface", surfaceColor);
    root.style.setProperty("--club-radius", { none: "0", sm: "0.25rem", md: "0.5rem", lg: "0.75rem" }[borderRadius]);

    try {
      await fetch("/api/club/" + CLUB_CONFIG.slug + "/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryColor, surfaceColor, fontFamily, borderRadius }),
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
      <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Apariencia del Club</h1>
      <p className="text-sm text-[var(--club-ink-muted)] mb-6">Personaliza colores, tipografía y aspecto visual.</p>
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Color Principal</CardTitle><CardDescription>Botones, enlaces y acentos</CardDescription></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-28 font-mono" />
              <div className="flex gap-2">
                {["#1a3a2a", "#d4eaf7", "#0f231a", "#ffffff", "#000000"].map((c) => (
                  <button key={c} onClick={() => setPrimaryColor(c)} className="w-6 h-6 rounded-full border-2 border-white shadow cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Color de Fondo</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <input type="color" value={surfaceColor} onChange={(e) => setSurfaceColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
              <Input value={surfaceColor} onChange={(e) => setSurfaceColor(e.target.value)} className="w-28 font-mono" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tipografía</CardTitle></CardHeader>
          <CardContent>
            <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className="w-full h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 text-sm bg-white">
              <option value="Saira">Saira ({CLUB_CONFIG.shortName})</option>
              <option value="Inter">Inter (moderna)</option>
              <option value="Barlow">Barlow (deportiva)</option>
              <option value="Playfair Display">Playfair (clásica)</option>
              <option value="DM Sans">DM Sans (minimalista)</option>
            </select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Redondez de Bordes</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(["none", "sm", "md", "lg"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setBorderRadius(r)}
                  className={`flex-1 py-3 border-2 text-sm font-medium cursor-pointer transition-all ${borderRadius === r ? "border-[var(--club-primary)] bg-[var(--club-primary)]/5 text-[var(--club-primary)]" : "border-[var(--club-border)] text-[var(--club-ink-muted)]"}`}
                  style={{ borderRadius: { none: "0", sm: "0.25rem", md: "0.5rem", lg: "0.75rem" }[r] }}
                >
                  {r === "none" ? "Cuadrado" : r === "sm" ? "Sutil" : r === "md" ? "Medio" : "Redondo"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
          {saved && <span className="text-sm text-[var(--club-primary)] font-medium">✓ Cambios aplicados</span>}
        </div>
      </div>
    </div>
  );
}
