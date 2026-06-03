"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Profile = {
  displayName: string;
  level: number | null;
  memberType: string;
  role: string;
  phone: string | null;
  joinedAt: string;
};

type Booking = {
  id: string;
  courtId: string;
  startTime: string;
  duration: number;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        // Fetch profile and recent bookings
        const [profileRes, bookingsRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/bookings?limit=8"),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.profile);
        }
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data.bookings || []);
        }
      } catch {
        // Degrade gracefully
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const s = profile || {
    displayName: "Jugador",
    level: null,
    memberType: "non_member",
    role: "guest",
    phone: null,
    joinedAt: new Date().toISOString(),
  };

  const recentBookings = bookings.slice(0, 8);
  const totalBookings = bookings.length;
  const favoriteCourts = [...new Set(bookings.map((b) => b.courtId?.slice(0, 8)))];
  const favoriteCourt = favoriteCourts[0] || "—";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-[var(--club-primary)] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
          {s.displayName.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">{s.displayName}</h1>
          <div className="flex items-center gap-3 mt-1">
            {s.level ? <Badge variant="default">Nivel {s.level}/7</Badge> : null}
            <Badge variant="outline">{s.memberType === "member" ? "Socio" : "No Socio"}</Badge>
            {s.phone && <span className="text-sm text-[var(--club-ink-muted)]">{s.phone}</span>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total partidos", value: totalBookings },
          { label: "Este mes", value: recentBookings.filter((b) => {
            const d = new Date(b.startTime);
            return d.getMonth() === new Date().getMonth();
          }).length },
          { label: "Pista habitual", value: favoriteCourt },
          { label: "Desde", value: new Date(s.joinedAt).toLocaleDateString("es-ES", { month: "short", year: "numeric" }) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-xs text-[var(--club-ink-muted)]">{stat.label}</p>
              <p className="text-2xl font-bold text-[var(--club-ink)] mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent bookings */}
      <Card>
        <CardHeader><CardTitle>Últimos Partidos</CardTitle></CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">
              No tienes partidos todavía. ¡Reserva tu primera pista!
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]">
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium">Pista</th>
                  <th className="py-2 font-medium">Hora</th>
                  <th className="py-2 font-medium">Dur.</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b, i) => {
                  const d = new Date(b.startTime);
                  return (
                    <tr key={b.id || i} className="border-b border-[var(--club-border)] last:border-0">
                      <td className="py-2 text-[var(--club-ink)]">{d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</td>
                      <td className="py-2 text-[var(--club-ink)]">{b.courtId?.slice(0, 8) || "—"}</td>
                      <td className="py-2 text-[var(--club-ink-muted)]">{d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="py-2 text-[var(--club-ink-muted)]">{b.duration} min</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
