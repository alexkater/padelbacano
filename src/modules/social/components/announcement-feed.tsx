"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
};

const typeStyles: Record<string, string> = {
  torneo: "bg-[var(--club-warning-bg)] text-[var(--club-warning)]",
  escuela: "bg-[var(--club-primary)]/10 text-[var(--club-primary)]",
  general: "bg-[var(--club-primary)]/10 text-[var(--club-primary)]",
};

export function AnnouncementFeed() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data.announcements);
        }
      } catch {
        // Silently fail — component degrades gracefully
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-[var(--club-ink)] mb-8">Noticias del Club</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-16 mb-3" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (announcements.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-20">
      <h2 className="text-3xl font-bold text-[var(--club-ink)] mb-8">Noticias del Club</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {announcements.map((a) => (
          <Card key={a.id} className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className={typeStyles[a.type] || typeStyles.general}>
                  {a.type}
                </Badge>
                <span className="text-xs text-[var(--club-ink-muted)]">
                  {new Date(a.createdAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <CardTitle className="text-base mb-2">{a.title}</CardTitle>
              <p className="text-sm text-[var(--club-ink-muted)]">{a.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
