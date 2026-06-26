"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useClubTenant } from "@/components/club/club-tenant-provider";
import { BookingView, type AlternativeSlot, type CancellationPolicy, type ClubPricing, type Slot } from "./booking-view";

function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

async function checkAuth(): Promise<boolean> {
  try {
    const res = await fetch("/api/user/profile");
    return res.ok;
  } catch {
    return false;
  }
}

export default function BookingPage() {
  const router = useRouter();
  const tenant = useClubTenant();
  const [authChecked, setAuthChecked] = useState(false);
  const [clubId, setClubId] = useState<string | null>(tenant.clubId);
  const [pricing, setPricing] = useState<ClubPricing | null>(null);
  const [cancelPolicy, setCancelPolicy] = useState<CancellationPolicy | null>(null);
  const [duration, setDuration] = useState<60 | 90>(60);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [bookingResult, setBookingResult] = useState<"idle" | "success" | "error" | "confirming">("idle");
  const [bookingMessage, setBookingMessage] = useState("");
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);

  // Auth check on mount — redirect to login if not authenticated
  useEffect(() => {
    async function verifyAuth() {
      const authed = await checkAuth();
      if (!authed) {
        const currentPath = window.location.pathname + window.location.search;
        router.replace(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
        return;
      }
      setAuthChecked(true);
    }
    void verifyAuth();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    async function resolveClub(): Promise<void> {
      try {
        const requestedClubId = new URLSearchParams(window.location.search).get("clubId");

        if (requestedClubId) {
          const res = await fetch("/api/clubs");
          if (res.ok) {
            const data = await res.json();
            const club = data.clubs?.find((candidate: { readonly id: string; readonly slug: string }) => candidate.id === requestedClubId);
            if (club) {
              const detail = await fetch(`/api/club/${club.slug}`);
              const clubData = detail.ok ? await detail.json() : club;
              setClubId(clubData.id);
              setPricing(clubData.pricing ?? null);
              setCancelPolicy(clubData.cancellationPolicy ?? null);
              return;
            }
          }
        }

        const fallback = await fetch(`/api/club/${tenant.slug}`);
        if (fallback.ok) {
          const data = await fallback.json();
          setClubId(data.id);
          setPricing(data.pricing);
          setCancelPolicy(data.cancellationPolicy);
        }
      } catch {
      }
    }
    void resolveClub();
  }, [tenant.slug, authChecked]);

  const fetchSlots = useCallback(async (dateStr: string) => {
    if (!clubId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings?clubId=${clubId}&date=${dateStr}&duration=${duration}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots);
      }
    } catch {
    }
    setLoading(false);
  }, [clubId, duration]);

  useEffect(() => {
    if (clubId) void fetchSlots(selectedDate);
  }, [selectedDate, clubId, duration, fetchSlots]);

  async function handleConfirm(): Promise<void> {
    if (!selectedSlot) return;
    setBookingResult("confirming");
    setAlternatives([]);

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
        void fetchSlots(selectedDate);
      } else if (res.status === 409) {
        const err = await res.json();
        setBookingResult("error");
        setBookingMessage(err.error || "Horario no disponible");
        if (err.alternatives && Array.isArray(err.alternatives)) {
          setAlternatives(err.alternatives);
        }
      } else if (res.status === 401) {
        setBookingResult("error");
        setBookingMessage("Tu sesión expiró. Inicia sesión de nuevo.");
        setAlternatives([]);
      } else {
        const err = await res.json();
        setBookingResult("error");
        setBookingMessage(err.error || "Error al crear la reserva");
      }
    } catch {
      setBookingResult("error");
      setBookingMessage("Error de conexión. Intenta de nuevo.");
    } finally {
      // If still confirming (i.e. not in confirm dialog), reset
      if (bookingResult === "confirming" && !showConfirm) {
        // do nothing, state already set above
      }
    }
  }

  function handleSelectAlternative(alt: AlternativeSlot) {
    const matchingSlot = slots.find(
      (s) => s.courtId === alt.courtId && s.startTime === alt.startTime
    );
    if (matchingSlot) {
      setSelectedSlot(matchingSlot);
      setShowConfirm(true);
    } else {
      // Slot not in current view, switch date/time to match
      setSelectedDate(alt.startTime.slice(0, 10));
    }
    setAlternatives([]);
    onClearBookingResult();
  }

  function onClearBookingResult() {
    setBookingResult("idle");
    setBookingMessage("");
    setAlternatives([]);
  }

  if (!authChecked) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin h-8 w-8 border-2 border-[var(--club-border)] border-t-[var(--club-primary)] rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <BookingView
      alternatives={alternatives}
      availableCount={slots.filter((slot) => slot.isAvailable).length}
      bookingMessage={bookingMessage}
      bookingResult={bookingResult}
      cancelPolicy={cancelPolicy}
      duration={duration}
      loading={loading}
      pricing={pricing}
      selectedDate={selectedDate}
      selectedSlot={selectedSlot}
      showConfirm={showConfirm}
      slots={slots}
      onClearBookingResult={onClearBookingResult}
      onConfirm={handleConfirm}
      onDurationChange={setDuration}
      onSelectedDateChange={setSelectedDate}
      onSelectedSlotChange={setSelectedSlot}
      onShowConfirmChange={setShowConfirm}
      onSelectAlternative={handleSelectAlternative}
    />
  );
}
