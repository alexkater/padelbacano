"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CancelBookingButton } from "@/components/cancel-booking-button";

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
  courtName: string | null;
  clubName: string | null;
  startTime: string;
  duration: number;
  status: string;
  bookingTime?: {
    date: string;
    time: string;
    displayTime: string;
    timezone: string;
  };
};

type NotificationPrefs = {
  emailEnabled: boolean;
  whatsAppEnabled: boolean;
  pushEnabled: boolean;
};

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    emailEnabled: true,
    whatsAppEnabled: true,
    pushEnabled: true,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushSubscribing, setPushSubscribing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [profileRes, bookingsRes, notifRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/bookings?limit=20"),
          fetch("/api/user/notifications"),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.profile);
        }
        if (bookingsRes.ok) {
          const data = await bookingsRes.json();
          setBookings(data.bookings || []);
        }
        if (notifRes.ok) {
          const data = await notifRes.json();
          if (data.preferences) {
            setNotifPrefs(data.preferences);
          }
        }
      } catch {
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!isPushSupported()) return;

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushSubscribed(sub !== null))
      .catch(() => {});
  }, []);

  async function toggleNotif(key: keyof NotificationPrefs, value: boolean) {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    setSavingNotif(true);
    try {
      await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {
      setNotifPrefs(notifPrefs);
    }
    setSavingNotif(false);
  }

  const subscribePush = useCallback(async () => {
    if (!isPushSupported() || !VAPID_PUBLIC_KEY) return;

    setPushSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });

      const body = JSON.stringify(sub);
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        setPushSubscribed(true);
      }
    } catch {
    }
    setPushSubscribing(false);
  }, []);

  const unsubscribePush = useCallback(async () => {
    if (!isPushSupported()) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;

        await sub.unsubscribe();

        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
      }
      setPushSubscribed(false);
    } catch {
    }
  }, []);

  function handleBookingCancelled(bookingId: string) {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );
  }

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

  const allBookings = bookings;
  const totalBookings = allBookings.length;
  const activeBookings = allBookings.filter((b) => b.status === "confirmed");
  const upcomingBookings = activeBookings.filter(
    (b) => new Date(b.startTime) > new Date()
  );
  const pastBookings = allBookings.filter(
    (b) => b.status === "cancelled" || new Date(b.startTime) <= new Date()
  );
  const favoriteCourtName =
    [...new Set(allBookings.map((b) => b.courtName).filter(Boolean))][0] || "—";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-start gap-6 mb-8">
        <div className="w-20 h-20 rounded-full bg-[var(--club-primary)] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
          {s.displayName.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">Mi Perfil</h1>
          <div className="flex items-center gap-3 mt-1">
            {s.level ? <Badge variant="default">Nivel {s.level}/7</Badge> : null}
            <Badge variant="outline">{s.memberType === "member" ? "Socio" : "No Socio"}</Badge>
            {s.phone && <span className="text-sm text-[var(--club-ink-muted)]">{s.phone}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total partidos", value: totalBookings },
          { label: "Próximos", value: upcomingBookings.length },
          { label: "Pista habitual", value: favoriteCourtName },
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

      {/* Upcoming bookings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Mis Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">
              No tienes reservas próximas.{' '}
              <a href="/reservar" className="text-[var(--club-primary)] underline">Reserva ahora</a>
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((b) => {
                const startDate = new Date(b.startTime);
                const displayDate = startDate.toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                });
                const displayTime = startDate.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const endTime = new Date(startDate.getTime() + b.duration * 60 * 1000);
                const displayEnd = endTime.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={b.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-[var(--club-radius)] border border-[var(--club-border)] bg-white p-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[var(--club-ink)] truncate">
                          {b.courtName || "Pista"}
                        </span>
                        {b.clubName && (
                          <span className="text-xs text-[var(--club-ink-muted)] truncate">
                            · {b.clubName}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--club-ink-muted)]">
                        {displayDate} · {displayTime} – {displayEnd} · {b.duration} min COT
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {b.status === "confirmed" ? (
                        <>
                          <Badge variant="default" className="bg-[var(--club-primary)]">Confirmada</Badge>
                          <CancelBookingButton
                            bookingId={b.id}
                            onCancelled={() => handleBookingCancelled(b.id)}
                          />
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[var(--club-ink-muted)]">Cancelada</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past bookings */}
      {pastBookings.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]">
                  <th className="py-2 font-medium">Club</th>
                  <th className="py-2 font-medium">Pista</th>
                  <th className="py-2 font-medium">Fecha</th>
                  <th className="py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pastBookings.slice(0, 10).map((b) => {
                  const d = new Date(b.startTime);
                  return (
                    <tr key={b.id} className="border-b border-[var(--club-border)] last:border-0">
                      <td className="py-2 text-[var(--club-ink)]">{b.clubName || "—"}</td>
                      <td className="py-2 text-[var(--club-ink)]">{b.courtName || "—"}</td>
                      <td className="py-2 text-[var(--club-ink-muted)]">
                        {d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-2">
                        <Badge variant={b.status === "confirmed" ? "default" : "outline"}>
                          {b.status === "confirmed" ? "Completado" : "Cancelado"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader><CardTitle>Notificaciones</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-[var(--club-ink)]">Correo electrónico</p>
              <p className="text-sm text-[var(--club-ink-muted)]">Confirmaciones, cancelaciones y avisos</p>
            </div>
            <Switch
              checked={notifPrefs.emailEnabled}
              onToggle={(v) => toggleNotif("emailEnabled", v)}
              disabled={savingNotif}
            />
          </label>
          <hr className="border-[var(--club-border)]" />
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-[var(--club-ink)]">WhatsApp</p>
              <p className="text-sm text-[var(--club-ink-muted)]">Recordatorios y notificaciones por mensaje</p>
            </div>
            <Switch
              checked={notifPrefs.whatsAppEnabled}
              onToggle={(v) => toggleNotif("whatsAppEnabled", v)}
              disabled={savingNotif}
            />
          </label>
          <hr className="border-[var(--club-border)]" />
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="font-medium text-[var(--club-ink)]">Push</p>
              <p className="text-sm text-[var(--club-ink-muted)]">Notificaciones en el navegador</p>
            </div>
            <Switch
              checked={notifPrefs.pushEnabled}
              onToggle={(v) => toggleNotif("pushEnabled", v)}
              disabled={savingNotif}
            />
          </label>

          {isPushSupported() && VAPID_PUBLIC_KEY && (
            <div className="pt-2">
              {pushSubscribed ? (
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                    <span className="size-2 rounded-full bg-green-500" />
                    Activado
                  </span>
                  <button
                    onClick={unsubscribePush}
                    className="text-xs text-[var(--club-ink-muted)] underline hover:text-[var(--club-danger)]"
                  >
                    Desactivar
                  </button>
                </div>
              ) : (
                <Button
                  onClick={subscribePush}
                  disabled={pushSubscribing}
                  size="sm"
                >
                  {pushSubscribing ? "Activando..." : "Activar notificaciones"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
