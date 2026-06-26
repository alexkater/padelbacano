import { clubRepo, bookingRepo } from "@/infra/db/repositories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db/index";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";


export default async function AdminCalendar() {
  const session = await auth();
  const profile = session?.user?.id
    ? (await db
        .select()
        .from(schema.userProfiles)
        .where(eq(schema.userProfiles.userId, session.user.id))
        .limit(1))[0]
    : null;

  const club = profile ? await clubRepo.findById(profile.clubId) : null;
  const confirmedBookings = club ? await bookingRepo.list({ status: "confirmed" }) : [];
  const firstClubBooking = confirmedBookings.find((booking) =>
    club?.courts.some((court) => court.id === booking.courtId)
  );
  const today = firstClubBooking?.startTime ?? new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const todayBookings = club
    ? await bookingRepo.listByDate(club.id, todayStart)
    : [];

  const courts =
    club?.courts
      .filter((c) => c.isActive)
      .sort((a, b) => a.order - b.order) ?? [];

  const HOURS = Array.from({ length: 15 }, (_, i) => i + 9);

  function getBookingAt(courtId: string, hour: number) {
    return todayBookings.find((b) => {
      if (b.courtId !== courtId || b.status !== "confirmed") return false;
      const startH = b.startTime.getHours();
      const endH = b.endTime.getHours();
      return hour >= startH && hour < endH;
    }) ?? null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--club-ink)]">Calendario</h1>
        <span className="text-xs px-2.5 py-0.5 rounded-full border border-[var(--club-border)] text-[var(--club-ink)]">
          {today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      <Card>
        <CardHeader><CardTitle>Vista por Pista</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 border-b border-[var(--club-border)] text-[var(--club-ink-muted)] font-medium sticky left-0 bg-white">Pista</th>
                  {HOURS.map((h) => (
                    <th key={h} className="text-center py-2 px-1 border-b border-[var(--club-border)] text-[var(--club-ink-muted)] font-medium min-w-[64px]">{h}:00</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courts.map((court) => (
                  <tr key={court.id}>
                    <td className="py-2 px-3 border-b border-[var(--club-border)] font-medium text-[var(--club-ink)] sticky left-0 bg-white">{court.name}</td>
                    {HOURS.map((h) => {
                      const b = getBookingAt(court.id, h);
                      const isStart = b && b.startTime.getHours() === h;
                      return (
                        <td key={h} className={`py-1 px-1 border-b border-[var(--club-border)] text-center ${b ? "bg-[var(--club-primary)]/10" : ""}`}>
                          {isStart ? (
                            <button data-booking-id={b.id} className="text-[10px] font-medium px-1 py-0.5 rounded block w-full truncate text-[var(--club-primary)]">
                              Reserva {b.startTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} · {b.duration}min
                            </button>
                          ) : b ? (
                            <span className="block h-full" />
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
