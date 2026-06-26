"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type CancelBookingButtonProps = {
  bookingId: string;
  onCancelled?: () => void;
};

export function CancelBookingButton({ bookingId, onCancelled }: CancelBookingButtonProps) {
  const [cancelled, setCancelled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("Cambio de planes");

  async function handleCancel() {
    if (!confirm("¿Cancelar esta reserva?")) return;
    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      setCancelled(true);
      onCancelled?.();
    }
    setLoading(false);
  }

  if (cancelled) {
    return <span className="text-xs text-[var(--club-danger)]">Cancelada</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        disabled={loading}
        className="h-7 rounded-[var(--pb-radius-sm)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] px-2 text-xs text-[var(--pb-text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pb-brand-primary)]"
      >
        <option>Cambio de planes</option>
        <option>No puedo asistir</option>
        <option>Otro</option>
      </select>
      <Button variant="ghost" size="sm" onClick={handleCancel} disabled={loading} className="text-[var(--pb-status-error)] hover:text-[var(--pb-status-error)] text-xs h-7">
        {loading ? "..." : "Cancelar"}
      </Button>
    </div>
  );
}
