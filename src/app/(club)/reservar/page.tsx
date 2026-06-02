"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { ChatComingSoon } from "@/components/community/chat-coming-soon";

// ─── Types ──────────────────────────────────────────────────────────────

type Slot = {
  courtId: string;
  courtName: string;
  startTime: string; // ISO string from API
  endTime: string;
  duration: number;
  isAvailable: boolean;
  bookingId: string | null;
  price: number | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_SLUG = "el-remate";
const HOURS = Array.from({ length: 14 }, (_, i) => i + 9);

// ─── Page ───────────────────────────────────────────────────────────────

export default function BookingPage() {
  const [clubId, setClubId] = useState<string | null>(null);
  const [pricing, setPricing] = useState<{ memberPrice: number; nonMemberPrice: number; currency: string } | null>(null);
  const [cancelPolicy, setCancelPolicy] = useState<{ minHoursBefore: number; penaltyPercent: number } | null>(null);
  const [duration, setDuration] = useState<60 | 90>(60);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bookingResult, setBookingResult] = useState<"idle" | "success" | "error">("idle");
  const [bookingMessage, setBookingMessage] = useState("");

  // Resolve club data from slug on mount
  useEffect(() => {
    async function resolveClub() {
      try {
        const res = await fetch(`/api/club/${DEFAULT_SLUG}`);
        if (res.ok) {
          const data = await res.json();
          setClubId(data.id);
          setPricing(data.pricing);
          setCancelPolicy(data.cancellationPolicy);
        }
      } catch (err) {
        console.error("Failed to resolve club", err);
      }
    }
    resolveClub();
  }, []);

  // Fetch slots when date changes
  const fetchSlots = useCallback(async (dateStr: string) => {
    if (!clubId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?clubId=${clubId}&date=${dateStr}&duration=${duration}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots);
      }
    } catch (err) {
      console.error("Failed to fetch slots", err);
    }
    setLoading(false);
  }, [clubId]);

  useEffect(() => {
    if (clubId) fetchSlots(selectedDate);
  }, [selectedDate, clubId, duration, fetchSlots]);

  // Group slots by court
  const courts = [...new Set(slots.map((s) => s.courtName))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const availableCount = slots.filter((s) => s.isAvailable).length;

  // Create booking
  async function handleConfirm() {
    if (!selectedSlot) return;
    setBookingResult("idle");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: selectedSlot.courtId,
          startTime: selectedSlot.startTime,
          duration: selectedSlot.duration,
        }),
      });

      if (res.ok) {
        setBookingResult("success");
        setBookingMessage("¡Reserva confirmada! Te esperamos en el club.");
        setShowConfirm(false);
        fetchSlots(selectedDate); // refresh grid
      } else {
        const err = await res.json();
        setBookingResult("error");
        setBookingMessage(err.error || "Error al crear la reserva");
      }
    } catch {
      setBookingResult("error");
      setBookingMessage("Error de conexión. Intenta de nuevo.");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ─── Booking result toast ──────────────────────────────────── */}
      {bookingResult !== "idle" && (
        <div
          className={`mb-4 px-4 py-3 rounded-[var(--club-radius)] text-sm font-medium ${
            bookingResult === "success"
              ? "bg-[var(--club-primary)]/5 text-[var(--club-primary)] border border-[var(--club-primary)]/20"
              : "bg-[var(--club-danger-bg)] text-[var(--club-danger)] border border-[var(--club-danger)]/20"
          }`}
        >
          {bookingMessage}
          <button
            onClick={() => setBookingResult("idle")}
            className="ml-3 underline text-xs"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ─── Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">Reservar Pista</h1>
          <p className="text-sm text-[var(--club-ink-muted)]">
            {loading ? "Cargando..." : `${availableCount} horarios disponibles`}
            {pricing && ` · Socio ${pricing.memberPrice} € / No socio ${pricing.nonMemberPrice} €`}
            {" · "}
            {formatDate(new Date(selectedDate))}
          </p>
          <div className="flex gap-1 mt-2">
            {([60, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors cursor-pointer ${
                  duration === d
                    ? "bg-[var(--club-primary)] text-white"
                    : "bg-[var(--club-surface-alt)] text-[var(--club-ink-muted)] hover:bg-[var(--club-border)]"
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
            const d = addDaysStr(todayStr(), offset);
            const isSelected = d === selectedDate;
            const date = new Date(d);
            return (
              <button
                key={offset}
                onClick={() => setSelectedDate(d)}
                className={`flex-shrink-0 px-4 py-2 rounded-[var(--club-radius)] text-sm font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[var(--club-primary)] text-white"
                    : "bg-white border border-[var(--club-border)] text-[var(--club-ink)] hover:bg-[var(--club-surface-alt)]"
                }`}
              >
                <div className="text-xs opacity-70">
                  {date.toLocaleDateString("es-ES", { weekday: "short" })}
                </div>
                <div>{date.getDate()}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Court grid ────────────────────────────────────────────── */}
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
                  {HOURS.map((h) => (
                    <th key={h} className="text-center py-2 px-2 text-[var(--club-ink-muted)] font-medium min-w-[70px]">
                      {h}:00
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courts.map((courtName) => {
                  const courtSlots = slots.filter((s) => s.courtName === courtName);
                  return (
                    <tr key={courtName} className="border-b border-[var(--club-border)] last:border-0">
                      <td className="py-2 px-3 font-medium text-[var(--club-ink)]">{courtName}</td>
                      {HOURS.map((h) => {
                        const slot = courtSlots.find(
                          (s) => new Date(s.startTime).getHours() === h
                        );
                        if (!slot) return <td key={h} className="py-2 px-2" />;
                        return (
                          <td key={h} className="py-2 px-2 text-center">
                            {slot.isAvailable ? (
                              <button
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setShowConfirm(true);
                                }}
                                className="w-full py-1.5 rounded-[var(--club-radius-sm)] bg-[var(--club-primary)]/10 text-[var(--club-primary)] text-xs font-medium hover:bg-[var(--club-primary)]/20 transition-colors cursor-pointer"
                              >
                                {formatTime(slot.startTime)}
                              </button>
                            ) : (
                              <div className="w-full py-1.5 rounded-[var(--club-radius-sm)] bg-[var(--club-danger-bg)] text-[var(--club-danger)]/40 text-xs">
                                —
                              </div>
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

      {/* Cancellation policy */}
      {cancelPolicy && (
        <p className="text-xs text-[var(--club-ink-muted)] mt-4 text-center">
          Política de cancelación: sin coste hasta {cancelPolicy.minHoursBefore}h antes.
          Después, penalización del {cancelPolicy.penaltyPercent}%.
        </p>
      )}

      <div className="mt-8">
        <ChatComingSoon />
      </div>

      {/* ─── Confirm dialog ────────────────────────────────────────── */}
      <Dialog open={showConfirm} onClose={() => setShowConfirm(false)}>
        {selectedSlot && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--club-ink)] mb-2">Confirmar Reserva</h2>
            <div className="space-y-2 text-sm text-[var(--club-ink-muted)] mb-6">
              <p><strong className="text-[var(--club-ink)]">Pista:</strong> {selectedSlot.courtName}</p>
              <p><strong className="text-[var(--club-ink)]">Fecha:</strong> {formatDate(new Date(selectedSlot.startTime))}</p>
              <p><strong className="text-[var(--club-ink)]">Hora:</strong> {formatTime(selectedSlot.startTime)} – {formatTime(selectedSlot.endTime)}</p>
              <p><strong className="text-[var(--club-ink)]">Duración:</strong> {selectedSlot.duration} min</p>
              {pricing && (
                <>
                  <div className="border-t border-[var(--club-border)] pt-2 mt-2">
                    <p className="flex justify-between">
                      <span>Socio</span>
                      <strong className="text-[var(--club-primary)]">{pricing.memberPrice} €</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>No socio</span>
                      <strong className="text-[var(--club-ink)]">{pricing.nonMemberPrice} €</strong>
                    </p>
                  </div>
                  <p className="text-xs text-[var(--club-ink-muted)]">
                    El precio final depende de tu tipo de membresía.
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleConfirm}>
                Confirmar Reserva
              </Button>
              <Button variant="outline" onClick={() => setShowConfirm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
