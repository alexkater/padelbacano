"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { MODULE_FLAGS } from "@/padelbacano.config";

type Invoice = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  total: number;
  status: "draft" | "issued" | "paid" | "cancelled" | "dian_rejected";
  issueDate: string;
  dianStatus: "pending" | "accepted" | "rejected" | null;
  customerEmail: string | null;
  items?: unknown[];
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  issued: "Emitida",
  paid: "Pagada",
  cancelled: "Anulada",
  dian_rejected: "Rechazada DIAN",
};

const STATUS_VARIANTS: Record<string, "default" | "outline" | "success" | "warning"> = {
  draft: "outline",
  issued: "warning",
  paid: "success",
  cancelled: "default",
  dian_rejected: "warning",
};

const PAGE_SIZE = 15;

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [nextNumber, setNextNumber] = useState("");
  const [form, setForm] = useState({
    customerName: "",
    customerDocument: "",
    customerDocumentType: "CC",
    customerEmail: "",
    items: [{ description: "", quantity: "1", unitPrice: "" }],
  });

  const fetchInvoices = useCallback(async (currentOffset: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("offset", String(currentOffset));
      params.set("limit", String(PAGE_SIZE));
      if (filterStatus) params.set("status", filterStatus);
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) throw new Error("Sesion expirada. Inicia sesion de nuevo.");
        throw new Error("Error al cargar facturas");
      }
      const data = await res.json();
      setInvoices(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setInvoices([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterFrom, filterTo]);

  useEffect(() => {
    setOffset(0);
    fetchInvoices(0);
  }, [fetchInvoices]);

  useEffect(() => {
    fetch("/api/invoices/next-number")
      .then((r) => r.json())
      .then((d) => setNextNumber(d.formatted))
      .catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  function goToPage(page: number) {
    const newOffset = (page - 1) * PAGE_SIZE;
    setOffset(newOffset);
    fetchInvoices(newOffset);
  }

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    fetchInvoices(0);
  }

  function handleFilterReset() {
    setFilterStatus("");
    setFilterFrom("");
    setFilterTo("");
    setOffset(0);
  }

  function downloadPdf(id: string) {
    window.open(`/api/invoices/${id}/pdf`, "_blank");
  }

  function downloadXml(id: string) {
    window.open(`/api/invoices/${id}/xml`, "_blank");
  }

  async function handleCreate() {
    const items = form.items
      .filter((i) => i.description && i.unitPrice)
      .map((i) => ({
        description: i.description,
        quantity: parseInt(i.quantity) || 1,
        unitPrice: parseInt(i.unitPrice) || 0,
      }));
    if (items.length === 0 || !form.customerName) return;
    try {
      await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, items }),
      });
      setShowCreate(false);
      setForm({
        customerName: "",
        customerDocument: "",
        customerDocumentType: "CC",
        customerEmail: "",
        items: [{ description: "", quantity: "1", unitPrice: "" }],
      });
      fetchInvoices(offset);
    } catch {
      // creation failed silently
    }
  }

  if (!MODULE_FLAGS.invoicing) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Facturacion</h1>
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">
              El modulo de facturacion no esta activado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--club-ink)]">
            Facturacion Electronica
          </h1>
          <p className="text-xs text-[var(--club-ink-muted)]">
            Cumplimiento DIAN
            {nextNumber ? (
              <span className="ml-2 font-mono">
                Proxima: {nextNumber}
              </span>
            ) : null}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + Nueva Factura
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-4">
          <form onSubmit={handleFilterSubmit}>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1 min-w-[160px]">
                <Label htmlFor="filter-from">Fecha desde</Label>
                <Input
                  id="filter-from"
                  type="date"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1 min-w-[160px]">
                <Label htmlFor="filter-to">Fecha hasta</Label>
                <Input
                  id="filter-to"
                  type="date"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                />
              </div>
              <div className="space-y-1 min-w-[140px]">
                <Label htmlFor="filter-status">Estado</Label>
                <select
                  id="filter-status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] bg-white px-3 text-sm text-[var(--club-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--club-primary)]"
                >
                  <option value="">Todos</option>
                  <option value="draft">Borrador</option>
                  <option value="issued">Emitida</option>
                  <option value="paid">Pagada</option>
                  <option value="cancelled">Anulada</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button size="sm" type="submit">
                  Filtrar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleFilterReset}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="mb-4 border-[var(--pb-status-error)]/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--pb-status-error)]">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchInvoices(offset)}
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Cargando facturas...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="pb-shimmer h-12 rounded-[var(--pb-radius-sm)] bg-[var(--pb-surface-secondary)]"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!loading && !error && invoices.length === 0 && (
        <Card>
          <CardContent>
            <div className="py-10 text-center">
              <p className="text-sm text-[var(--club-ink-muted)] mb-2">
                No hay facturas que coincidan con los filtros.
              </p>
              <p className="text-xs text-[var(--club-ink-muted)]">
                {filterStatus || filterFrom || filterTo
                  ? "Prueba a ajustar los filtros o crea una nueva factura."
                  : "Crea la primera factura electronica usando el boton + Nueva Factura."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice table */}
      {!loading && !error && invoices.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Facturas
                <span className="ml-2 text-sm font-normal text-[var(--club-ink-muted)]">
                  {total} resultado{total !== 1 ? "s" : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]">
                    <th className="py-2 pr-3 font-medium whitespace-nowrap">N.º</th>
                    <th className="py-2 pr-3 font-medium whitespace-nowrap">Cliente</th>
                    <th className="py-2 pr-3 font-medium whitespace-nowrap">Fecha</th>
                    <th className="py-2 pr-3 font-medium whitespace-nowrap text-right">
                      Total (COP)
                    </th>
                    <th className="py-2 pr-3 font-medium whitespace-nowrap">Estado</th>
                    <th className="py-2 font-medium whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-[var(--club-border)] last:border-0 hover:bg-[var(--pb-surface-secondary)]/50 transition-colors"
                    >
                      <td className="py-3 pr-3 text-[var(--club-ink)] font-mono text-xs whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 pr-3 text-[var(--club-ink)] max-w-[200px] truncate">
                        {inv.customerName}
                      </td>
                      <td className="py-3 pr-3 text-[var(--club-ink-muted)] text-xs whitespace-nowrap">
                        {new Date(inv.issueDate).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-3 text-right font-medium tabular-nums whitespace-nowrap">
                        ${(inv.total / 100).toLocaleString("es-CO")}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <Badge variant={STATUS_VARIANTS[inv.status] ?? "outline"}>
                          {STATUS_LABELS[inv.status] ?? inv.status}
                        </Badge>
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadPdf(inv.id)}
                            className="text-xs"
                            title="Descargar PDF"
                          >
                            PDF
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => downloadXml(inv.id)}
                            className="text-xs"
                            title="Descargar XML DIAN"
                          >
                            XML
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
                className="text-xs"
              >
                Anterior
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (currentPage <= 4) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = currentPage - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="text-xs min-w-[32px]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className="text-xs"
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create invoice dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          <h2 className="text-lg font-semibold mb-4">
            Nueva Factura
            {nextNumber ? (
              <span className="ml-2 text-sm font-normal text-[var(--club-ink-muted)] font-mono">
                {nextNumber}
              </span>
            ) : null}
          </h2>
          <div className="space-y-3 mb-4">
            <div className="space-y-1">
              <Label>Cliente</Label>
              <Input
                value={form.customerName}
                onChange={(e) =>
                  setForm({ ...form, customerName: e.target.value })
                }
                placeholder="Nombre o razon social"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Tipo Doc.</Label>
                <select
                  value={form.customerDocumentType}
                  onChange={(e) =>
                    setForm({ ...form, customerDocumentType: e.target.value })
                  }
                  className="w-full h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 text-sm bg-white text-[var(--club-ink)]"
                >
                  <option value="CC">CC</option>
                  <option value="NIT">NIT</option>
                  <option value="CE">CE</option>
                  <option value="PP">PP</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>N. Documento</Label>
                <Input
                  value={form.customerDocument}
                  onChange={(e) =>
                    setForm({ ...form, customerDocument: e.target.value })
                  }
                  placeholder="123456789"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={form.customerEmail}
                onChange={(e) =>
                  setForm({ ...form, customerEmail: e.target.value })
                }
                placeholder="cliente@email.com"
              />
            </div>
            <div className="border-t pt-3">
              <Label className="mb-2 block">Conceptos</Label>
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                  <Input
                    className="col-span-5"
                    value={item.description}
                    onChange={(e) => {
                      const items = [...form.items];
                      items[i].description = e.target.value;
                      setForm({ ...form, items });
                    }}
                    placeholder="Descripcion"
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const items = [...form.items];
                      items[i].quantity = e.target.value;
                      setForm({ ...form, items });
                    }}
                    placeholder="Cant"
                  />
                  <Input
                    className="col-span-3"
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const items = [...form.items];
                      items[i].unitPrice = e.target.value;
                      setForm({ ...form, items });
                    }}
                    placeholder="$ precio"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="col-span-2 text-[var(--club-danger)]"
                    onClick={() => {
                      setForm({
                        ...form,
                        items: form.items.filter((_, j) => j !== i),
                      });
                    }}
                  >
                    X
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm({
                    ...form,
                    items: [
                      ...form.items,
                      { description: "", quantity: "1", unitPrice: "" },
                    ],
                  })
                }
              >
                + Anadir concepto
              </Button>
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleCreate}>
              Emitir Factura
            </Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
