import { CLUB_CONFIG } from "@/padelbacano.config";
import Link from "next/link";
import { clubRepo, bookingRepo } from "@/infra/db/repositories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CancelBookingButton } from "@/components/cancel-booking-button";

export const dynamic = "force-dynamic";


export default async function AdminDashboard() {
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const todayBookings = club
    ? await bookingRepo.listByDate(club.id, todayStart)
    : [];

  const confirmed = todayBookings.filter((b) => b.status === "confirmed").length;
  const cancelled = todayBookings.filter((b) => b.status === "cancelled").length;
  const totalCourts = club?.courts.length ?? 0;
  const maxSlots = totalCourts * 14;
  const occupancyPct = maxSlots > 0 ? Math.round((confirmed / maxSlots) * 100) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Reservas hoy", value: String(confirmed), change: `${cancelled} canceladas` },
          { label: "Ocupación", value: `${occupancyPct}%`, change: `${totalCourts} pistas × 14h` },
          { label: "Total pistas", value: String(totalCourts), change: "Todas indoor cristal" },
          { label: "Socios activos", value: "—", change: "Próximamente" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <p className="text-sm text-[var(--club-ink-muted)]">{stat.label}</p>
              <p className="text-3xl font-bold text-[var(--club-ink)] mt-1">{stat.value}</p>
              <p className="text-xs text-[var(--club-ink-muted)] mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reservas de Hoy</CardTitle>
            <Link href="/admin/calendario" className="text-sm text-[var(--club-primary)] hover:underline">
              Ver calendario →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {todayBookings.length === 0 ? (
            <p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">
              No hay reservas para hoy todavía.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]">
                  <th className="py-2 font-medium">Pista</th>
                  <th className="py-2 font-medium">Hora</th>
                  <th className="py-2 font-medium">Dur.</th>
                  <th className="py-2 font-medium">Estado</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {todayBookings.map((b) => (
                  <tr key={b.id} className="border-b border-[var(--club-border)] last:border-0">
                    <td className="py-2 text-[var(--club-ink)]">{b.courtId.slice(0, 8)}</td>
                    <td className="py-2 text-[var(--club-ink-muted)]">
                      {b.startTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2 text-[var(--club-ink-muted)]">{b.duration}m</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === "confirmed" ? "bg-[var(--club-primary)]/10 text-[var(--club-primary)]" : "bg-[var(--club-danger-bg)] text-[var(--club-danger)]"}`}>
                        {b.status === "confirmed" ? "Confirmada" : "Cancelada"}
                      </span>
                    </td>
                    <td className="py-2">
                      {b.status === "confirmed" && <CancelBookingButton bookingId={b.id} />}
                    </td>
                    <td className="py-2 text-[var(--club-ink-muted)]">{b.duration} min</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        b.status === "confirmed" ? "bg-[var(--club-primary)]/10 text-[var(--club-primary)]" : "bg-[var(--club-danger-bg)] text-[var(--club-danger)]"
                      }`}>
                        {b.status === "confirmed" ? "Confirmada" : "Cancelada"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
