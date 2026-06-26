import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ChatComingSoon } from "@/components/community/chat-coming-soon";
import { OpenMatches } from "@/modules/social/components";
import Link from "next/link";

export type Slot = {
  readonly courtId: string;
  readonly courtName: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly duration: number;
  readonly isAvailable: boolean;
  readonly bookingId: string | null;
  readonly price: number | null;
};

export type ClubPricing = {
  readonly memberPrice: number;
  readonly nonMemberPrice: number;
  readonly currency: string;
};

export type CancellationPolicy = { readonly minHoursBefore: number; readonly penaltyPercent: number };

export type AlternativeSlot = {
  readonly courtId: string;
  readonly courtName: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly duration: 60 | 90;
  readonly price: number | null;
  readonly startTimeCOT: string;
  readonly endTimeCOT: string;
  readonly displayTime: string;
};

type BookingViewProps = {
  readonly availableCount: number;
  readonly bookingMessage: string;
  readonly bookingResult: "idle" | "success" | "error" | "confirming";
  readonly cancelPolicy: CancellationPolicy | null;
  readonly duration: 60 | 90;
  readonly loading: boolean;
  readonly pricing: ClubPricing | null;
  readonly selectedDate: string;
  readonly selectedSlot: Slot | null;
  readonly showConfirm: boolean;
  readonly slots: readonly Slot[];
  readonly alternatives: readonly AlternativeSlot[];
  readonly onClearBookingResult: () => void;
  readonly onConfirm: () => void;
  readonly onDurationChange: (duration: 60 | 90) => void;
  readonly onSelectedDateChange: (date: string) => void;
  readonly onSelectedSlotChange: (slot: Slot) => void;
  readonly onShowConfirmChange: (show: boolean) => void;
  readonly onSelectAlternative: (slot: AlternativeSlot) => void;
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 9);

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function priceLabel(value: number, currency: string): string { return `${value.toLocaleString("es-CO")} ${currency}`; }

export function BookingView({
  availableCount,
  bookingMessage,
  bookingResult,
  cancelPolicy,
  duration,
  loading,
  pricing,
  selectedDate,
  selectedSlot,
  showConfirm,
  slots,
  alternatives,
  onClearBookingResult,
  onConfirm,
  onDurationChange,
  onSelectedDateChange,
  onSelectedSlotChange,
  onShowConfirmChange,
  onSelectAlternative,
}: BookingViewProps) {
  const courts = [...new Set(slots.map((slot) => slot.courtName))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {bookingResult !== "idle" && (
        <div
          className={`mb-4 px-4 py-3 rounded-[var(--club-radius)] text-sm font-medium ${
            bookingResult === "success"
              ? "bg-[var(--club-primary)]/5 text-[var(--club-primary)] border border-[var(--club-primary)]/20"
              : "bg-[var(--club-danger-bg)] text-[var(--club-danger)] border border-[var(--club-danger)]/20"
          }`}
        >
          <span>{bookingMessage}</span>
          {bookingResult === "success" && (
            <Link href="/perfil" className="ml-3 underline text-xs font-semibold">
              Ver mis reservas
            </Link>
          )}
          <button onClick={onClearBookingResult} className="ml-3 underline text-xs">
            Cerrar
          </button>
        </div>
      )}

      {/* 409 alternatives */}
      {bookingResult === "error" && alternatives.length > 0 && (
        <div className="mb-4 px-4 py-3 rounded-[var(--club-radius)] bg-[var(--club-warning-bg)] border border-[var(--club-warning)]/20 text-sm">
          <p className="font-medium text-[var(--club-warning)] mb-2">Horarios alternativos disponibles:</p>
          <div className="flex flex-wrap gap-2">
            {alternatives.map((alt, i) => (
              <button
                key={`${alt.courtId}-${alt.startTime}-${i}`}
                onClick={() => onSelectAlternative(alt)}
                className="px-3 py-1.5 rounded-[var(--club-radius-sm)] bg-white border border-[var(--club-border)] text-xs font-medium text-[var(--club-ink)] hover:border-[var(--club-primary)] hover:text-[var(--club-primary)] transition-colors cursor-pointer"
              >
                {alt.courtName} · {formatTime(alt.startTime)} {alt.price ? `· ${priceLabel(alt.price, "COP")}` : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">Reservar Pista</h1>
          <p className="text-sm text-[var(--club-ink-muted)]">
            {loading ? "Cargando..." : `${availableCount} horarios disponibles`}
            {pricing && ` · Socio ${priceLabel(pricing.memberPrice, pricing.currency)} / No socio ${priceLabel(pricing.nonMemberPrice, pricing.currency)}`}
            {" · "}
            {formatDate(new Date(selectedDate))}
          </p>
          <div className="flex gap-1 mt-2">
            {([60, 90] as const).map((value) => (
              <button
                key={value}
                onClick={() => onDurationChange(value)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer ${
                  duration === value
                    ? "bg-[var(--club-primary)] text-white"
                    : "bg-[var(--club-surface-alt)] text-[var(--club-ink-muted)] hover:bg-[var(--club-border)]"
                }`}
              >
                {value} min
              </button>
            ))}
          </div>
          <label className="mt-3 block text-sm font-medium text-[var(--club-ink)]">
            Fecha
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => onSelectedDateChange(event.target.value)}
              className="mt-1 block rounded-[var(--club-radius)] border border-[var(--club-border)] bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
            const dateValue = addDaysStr(todayStr(), offset);
            const isSelected = dateValue === selectedDate;
            const date = new Date(dateValue);
            return (
              <button
                key={offset}
                onClick={() => onSelectedDateChange(dateValue)}
                className={`flex-shrink-0 px-4 py-2 rounded-[var(--club-radius)] text-sm font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--club-primary)] text-white"
                    : "bg-white border border-[var(--club-border)] text-[var(--club-ink)] hover:bg-[var(--club-surface-alt)]"
                }`}
              >
                <div className="text-xs opacity-70">{date.toLocaleDateString("es-ES", { weekday: "short" })}</div>
                <div>{date.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horarios disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--club-border)]">
                  <th className="text-left py-2 px-3 text-[var(--club-ink-muted)] font-medium">Pista</th>
                  {HOURS.map((hour) => (
                    <th key={hour} className="text-center py-2 px-2 text-[var(--club-ink-muted)] font-medium min-w-[70px]">
                      {hour}:00
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courts.map((courtName) => {
                  const courtSlots = slots.filter((slot) => slot.courtName === courtName);
                  return (
                    <tr key={courtName} className="border-b border-[var(--club-border)] last:border-0">
                      <td className="py-2 px-3 font-medium text-[var(--club-ink)]">{courtName}</td>
                      {HOURS.map((hour) => {
                        const slot = courtSlots.find((candidate) => new Date(candidate.startTime).getHours() === hour);
                        if (!slot) return <td key={hour} className="py-2 px-2" />;

                        return (
                          <td key={hour} className="py-2 px-2 text-center">
                            {slot.isAvailable ? (
                              <button
                                onClick={() => {
                                  onSelectedSlotChange(slot);
                                  onShowConfirmChange(true);
                                }}
                                className="w-full py-1.5 rounded-[var(--club-radius-sm)] bg-[var(--club-primary)]/10 text-[var(--club-primary)] text-xs font-medium hover:bg-[var(--club-primary)]/20 transition-colors cursor-pointer"
                              >
                                {formatTime(slot.startTime)}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full py-1.5 rounded-[var(--club-radius-sm)] bg-[var(--club-danger-bg)] text-[var(--club-danger)]/40 text-xs"
                              >
                                Ocupado {formatTime(slot.startTime)}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {cancelPolicy && (
        <p className="text-xs text-[var(--club-ink-muted)] mt-4 text-center">
          Política de cancelación: sin coste hasta {cancelPolicy.minHoursBefore}h antes. Después, penalización del {cancelPolicy.penaltyPercent}%.
        </p>
      )}

      {!showConfirm && (
        <div className="mt-8">
          <OpenMatches />
          <div className="mt-8">
            <ChatComingSoon />
          </div>
        </div>
      )}

      <Dialog open={showConfirm} onClose={() => onShowConfirmChange(false)}>
        {selectedSlot && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--club-ink)] mb-2">Confirmar Reserva</h2>
            <div className="space-y-2 text-sm text-[var(--club-ink-muted)] mb-6">
              <p><strong className="text-[var(--club-ink)]">Pista:</strong> {selectedSlot.courtName}</p>
              <p><strong className="text-[var(--club-ink)]">Fecha:</strong> {formatDate(new Date(selectedSlot.startTime))}</p>
              <p><strong className="text-[var(--club-ink)]">Hora:</strong> {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}</p>
              <p><strong className="text-[var(--club-ink)]">Duración:</strong> {selectedSlot.duration} min</p>
              {pricing && (
                <div className="border-t border-[var(--club-border)] pt-2 mt-2">
                  <p className="flex justify-between"><span>Socio</span><strong className="text-[var(--club-primary)]">{priceLabel(pricing.memberPrice, pricing.currency)}</strong></p>
                  <p className="flex justify-between"><span>No socio</span><strong className="text-[var(--club-ink)]">{priceLabel(pricing.nonMemberPrice, pricing.currency)}</strong></p>
                  <p className="mt-2 text-xs text-[var(--club-ink-muted)]">El precio final depende de tu tipo de membresía.</p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={onConfirm} disabled={bookingResult === "confirming"}>
                {bookingResult === "confirming" ? "Reservando..." : "Confirmar Reserva"}
              </Button>
              <Button variant="outline" onClick={() => onShowConfirmChange(false)} disabled={bookingResult === "confirming"}>Cancelar</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
