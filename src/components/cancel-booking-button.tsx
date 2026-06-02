"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [cancelled, setCancelled] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (!confirm("¿Cancelar esta reserva?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: "PUT" });
      if (res.ok) setCancelled(true);
    } catch { /* ignore */ }
    setLoading(false);
  }

  if (cancelled) {
    return <span className="text-xs text-[var(--club-danger)]">Cancelada</span>;
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleCancel} disabled={loading} className="text-[var(--club-danger)] hover:text-[var(--club-danger-hover)] text-xs h-7">
      {loading ? "..." : "Cancelar"}
    </Button>
  );
}
