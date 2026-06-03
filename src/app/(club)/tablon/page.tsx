"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";

type Post = {
  id: string;
  name: string;
  level: number;
  schedule: string;
  notes: string | null;
  createdAt: string;
};

export default function PartnerBoardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("3");
  const [schedule, setSchedule] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/partner-posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleSubmit() {
    if (!name || !level || !schedule) return;
    setSaving(true);
    try {
      const res = await fetch("/api/partner-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, level: parseInt(level), schedule, notes }),
      });
      if (res.ok) {
        setShowForm(false);
        setName("");
        setLevel("3");
        setSchedule("");
        setNotes("");
        fetchPosts();
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">Busco Compañero/a</h1>
          <p className="text-sm text-[var(--club-ink-muted)] mt-1">
            Encuentra gente de tu nivel para jugar al pádel
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          + Publicar Anuncio
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">
              No hay anuncios de búsqueda de compañero todavía. ¡Sé el primero en publicar!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--club-primary)]/10 flex items-center justify-center text-sm font-bold text-[var(--club-primary)]">
                      {post.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{post.name}</CardTitle>
                      <p className="text-xs text-[var(--club-ink-muted)]">
                        {new Date(post.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Nivel {post.level}/7</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {post.notes && <p className="text-sm text-[var(--club-ink)] mb-3">{post.notes}</p>}
                <div className="flex items-center gap-2 text-xs text-[var(--club-ink-muted)]">
                  <span>🕐 {post.schedule}</span>
                </div>
                <button className="mt-3 w-full py-2 border border-[var(--club-primary)] text-[var(--club-primary)] rounded-[var(--club-radius)] text-sm font-medium hover:bg-[var(--club-primary)]/5 transition-colors cursor-pointer">
                  Contactar
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New post dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)}>
        <div>
          <h2 className="text-lg font-semibold text-[var(--club-ink)] mb-4">Publicar Anuncio</h2>
          <div className="space-y-3 mb-6">
            <div className="space-y-1">
              <Label>Tu nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Carlos R." />
            </div>
            <div className="space-y-1">
              <Label>Nivel (1-7)</Label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 text-sm bg-white">
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>Nivel {n}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Disponibilidad horaria</Label>
              <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Ej: Jueves y viernes tarde" />
            </div>
            <div className="space-y-1">
              <Label>Notas (opcional)</Label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full min-h-[60px] rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 py-2 text-sm bg-white" rows={2} placeholder="Ej: Busco partido nivel medio. Juego de drive." />
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleSubmit} disabled={saving || !name || !schedule}>
              {saving ? "Publicando..." : "Publicar"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
