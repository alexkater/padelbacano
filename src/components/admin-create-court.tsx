"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminCreateCourt() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [createdName, setCreatedName] = useState("");
  const [error, setError] = useState("");

  async function createCourt() {
    setError("");
    const response = await fetch("/api/admin/courts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      setError("No se pudo crear la pista");
      return;
    }

    const data = await response.json();
    setCreatedName(data.court.name);
    setName("");
    setOpen(false);
  }

  return (
    <div className="mb-6 flex flex-col items-start gap-3">
      <Button onClick={() => setOpen(true)}>Nueva pista</Button>
      {createdName && <p className="text-sm text-[var(--club-primary)]">{createdName}</p>}
      {error && <p className="text-sm text-[var(--club-danger)]">{error}</p>}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            createCourt();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="court-name">Nombre</Label>
            <Input id="court-name" name="name" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <Button type="submit">Crear</Button>
        </form>
      </Dialog>
    </div>
  );
}
