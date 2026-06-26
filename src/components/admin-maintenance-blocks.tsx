"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminCourt = {
  readonly id: string;
  readonly name: string;
};

type MaintenanceBlock = {
  readonly id: string;
  readonly courtId: string;
  readonly courtName: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly reason: string;
};

type Props = {
  readonly courts: readonly AdminCourt[];
  readonly initialBlocks: readonly MaintenanceBlock[];
};

type CreatedBlockResponse = {
  readonly block?: {
    readonly id?: unknown;
    readonly courtId?: unknown;
    readonly startTime?: unknown;
    readonly endTime?: unknown;
    readonly reason?: unknown;
  };
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getCreatedBlock(data: CreatedBlockResponse, courtName: string): MaintenanceBlock | null {
  const block = data.block;
  if (
    typeof block?.id !== "string" ||
    typeof block.courtId !== "string" ||
    typeof block.startTime !== "string" ||
    typeof block.endTime !== "string" ||
    typeof block.reason !== "string"
  ) {
    return null;
  }

  return {
    id: block.id,
    courtId: block.courtId,
    courtName,
    startTime: block.startTime,
    endTime: block.endTime,
    reason: block.reason,
  };
}

export function AdminMaintenanceBlocks({ courts, initialBlocks }: Props) {
  const firstCourtId = courts[0]?.id ?? "";
  const [blocks, setBlocks] = useState<readonly MaintenanceBlock[]>(initialBlocks);
  const [courtId, setCourtId] = useState(firstCourtId);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function createBlock() {
    setPending(true);
    setError("");
    setMessage("");

    const response = await fetch(`/api/admin/courts/${courtId}/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        reason,
      }),
    });

    setPending(false);

    if (!response.ok) {
      setError(response.status === 409 ? "Ya existe un bloqueo en ese horario." : "No se pudo crear el bloqueo.");
      return;
    }

    const selectedCourtName = courts.find((court) => court.id === courtId)?.name ?? "Pista";
    const data: CreatedBlockResponse = await response.json();
    const createdBlock = getCreatedBlock(data, selectedCourtName);
    if (!createdBlock) {
      setError("La respuesta del servidor no tiene el formato esperado.");
      return;
    }

    setBlocks((current) => [...current, createdBlock].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setStartTime("");
    setEndTime("");
    setReason("");
    setMessage("Bloqueo de mantenimiento creado.");
  }

  async function deleteBlock(block: MaintenanceBlock) {
    setError("");
    setMessage("");

    const response = await fetch(`/api/admin/courts/${block.courtId}/maintenance/${block.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("No se pudo eliminar el bloqueo.");
      return;
    }

    setBlocks((current) => current.filter((item) => item.id !== block.id));
    setMessage("Bloqueo eliminado.");
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Mantenimiento de pistas</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_1.4fr_auto] md:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            createBlock();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="maintenance-court">Pista</Label>
            <select
              id="maintenance-court"
              className="h-10 w-full rounded-[var(--club-radius)] border border-[var(--club-border)] bg-white px-3 text-sm text-[var(--club-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-primary)]"
              value={courtId}
              onChange={(event) => setCourtId(event.target.value)}
              required
            >
              {courts.map((court) => (
                <option key={court.id} value={court.id}>{court.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance-start">Inicio</Label>
            <Input id="maintenance-start" type="datetime-local" value={startTime} onChange={(event) => setStartTime(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance-end">Fin</Label>
            <Input id="maintenance-end" type="datetime-local" value={endTime} onChange={(event) => setEndTime(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maintenance-reason">Motivo</Label>
            <Input id="maintenance-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Cambio de luces" required />
          </div>
          <Button type="submit" disabled={pending || courts.length === 0}>{pending ? "Guardando" : "Bloquear"}</Button>
        </form>

        {message && <p className="mt-3 text-sm text-[var(--club-primary)]">{message}</p>}
        {error && <p className="mt-3 text-sm text-[var(--club-danger)]">{error}</p>}

        <div className="mt-6 overflow-x-auto">
          {blocks.length === 0 ? (
            <p className="rounded-[var(--club-radius)] border border-dashed border-[var(--club-border)] p-4 text-center text-sm text-[var(--club-ink-muted)]">
              No hay bloqueos de mantenimiento activos.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]">
                  <th className="py-2 font-medium">Pista</th>
                  <th className="py-2 font-medium">Inicio</th>
                  <th className="py-2 font-medium">Fin</th>
                  <th className="py-2 font-medium">Motivo</th>
                  <th className="py-2 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block) => (
                  <tr key={block.id} className="border-b border-[var(--club-border)] last:border-0">
                    <td className="py-2 text-[var(--club-ink)]">{block.courtName}</td>
                    <td className="py-2 text-[var(--club-ink-muted)]">{formatDateTime(block.startTime)}</td>
                    <td className="py-2 text-[var(--club-ink-muted)]">{formatDateTime(block.endTime)}</td>
                    <td className="py-2 text-[var(--club-ink-muted)]">{block.reason}</td>
                    <td className="py-2">
                      <Button variant="ghost" size="sm" onClick={() => deleteBlock(block)}>Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
