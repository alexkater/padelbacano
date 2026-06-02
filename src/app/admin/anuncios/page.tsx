"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const MOCK = [
  { id: 1, title: "¡Campeones de Andalucía!", type: "torneo", date: "28 Feb" },
  { id: 2, title: "Nuevos horarios de escuela", type: "escuela", date: "15 Mar" },
];

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("general");
  const [saved, setSaved] = useState(false);

  function handleAdd() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTitle("");
    setContent("");
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Anuncios del Club</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Nuevo Anuncio</CardTitle>
          <CardDescription>Aparecerá en la página principal del club</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Torneo este sábado" />
          </div>
          <div className="space-y-2">
            <Label>Contenido</Label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full min-h-[80px] rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 py-2 text-sm bg-white" rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 text-sm bg-white">
              <option value="general">General</option>
              <option value="torneo">Torneo</option>
              <option value="escuela">Escuela</option>
            </select>
          </div>
          <Button onClick={handleAdd}>Publicar Anuncio</Button>
          {saved && <span className="text-sm text-[var(--club-primary)] font-medium ml-3">✓ Publicado</span>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Anuncios Publicados</CardTitle></CardHeader>
        <CardContent>
          {MOCK.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3 border-b border-[var(--club-border)] last:border-0">
              <div>
                <p className="text-sm font-medium text-[var(--club-ink)]">{a.title}</p>
                <p className="text-xs text-[var(--club-ink-muted)]">{a.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{a.type}</Badge>
                <Button variant="ghost" size="sm" className="text-[var(--club-danger)] text-xs">Eliminar</Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
