"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { MODULE_FLAGS } from "@/padelbacano.config";

type Invoice = { id: string; invoiceNumber: string; customerName: string; total: number; status: string; issueDate: string; dianStatus: string | null; items?: any[] };
const STATUS_COLORS: Record<string, string> = { draft: "bg-gray-100 text-gray-700", issued: "bg-blue-100 text-blue-700", paid: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };

export default function InvoicingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [nextNumber, setNextNumber] = useState("");
  const [form, setForm] = useState({ customerName: "", customerDocument: "", customerDocumentType: "CC", customerEmail: "", items: [{ description: "", quantity: "1", unitPrice: "" }] });

  const fetchInvoices = useCallback(async () => {
    try { const res = await fetch("/api/invoices"); if (res.ok) { const d = await res.json(); setInvoices(d.invoices); } } catch { }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
    fetch("/api/invoices/next-number").then(r => r.json()).then(d => setNextNumber(d.formatted));
  }, [fetchInvoices]);

  async function handleCreate() {
    const items = form.items.filter(i => i.description && i.unitPrice).map(i => ({ description: i.description, quantity: parseInt(i.quantity) || 1, unitPrice: parseInt(i.unitPrice) || 0 }));
    if (items.length === 0 || !form.customerName) return;
    await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, items }) });
    setShowCreate(false); fetchInvoices();
  }

  async function viewPDF(id: string) { window.open(`/api/invoices/${id}/pdf`, "_blank"); }

  if (!MODULE_FLAGS.invoicing) return <div className="max-w-2xl"><h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Facturación</h1><Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">El módulo de facturación no está activado.</p></CardContent></Card></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-[var(--club-ink)]">Facturación Electrónica</h1><p className="text-xs text-[var(--club-ink-muted)]">Cumplimiento DIAN · Próxima: {nextNumber}</p></div>
        <Button size="sm" onClick={() => setShowCreate(true)}>+ Nueva Factura</Button>
      </div>

      {loading ? <div className="animate-pulse"><div className="h-16 bg-gray-200 rounded mb-3" /></div> : invoices.length === 0 ? (
        <Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">No hay facturas. Crea la primera.</p></CardContent></Card>
      ) : (
        <Card><CardHeader><CardTitle>Facturas ({invoices.length})</CardTitle></CardHeader><CardContent>
          <table className="w-full text-sm"><thead><tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]"><th className="py-2 font-medium">Nº</th><th className="py-2 font-medium">Cliente</th><th className="py-2 font-medium">Fecha</th><th className="py-2 font-medium">Total</th><th className="py-2 font-medium">Estado</th><th className="py-2 font-medium">DIAN</th><th className="py-2"></th></tr></thead>
          <tbody>{invoices.map(inv => (
            <tr key={inv.id} className="border-b border-[var(--club-border)] last:border-0">
              <td className="py-2 text-[var(--club-ink)] font-mono text-xs">{inv.invoiceNumber}</td>
              <td className="py-2 text-[var(--club-ink)]">{inv.customerName}</td>
              <td className="py-2 text-[var(--club-ink-muted)] text-xs">{new Date(inv.issueDate).toLocaleDateString("es-CO")}</td>
              <td className="py-2 font-medium">${(inv.total / 100).toLocaleString("es-CO")}</td>
              <td className="py-2"><Badge className={STATUS_COLORS[inv.status] || ""}>{inv.status}</Badge></td>
              <td className="py-2 text-xs">{inv.dianStatus === "accepted" ? "✅" : inv.dianStatus === "rejected" ? "❌" : "—"}</td>
              <td className="py-2"><Button variant="ghost" size="sm" onClick={() => viewPDF(inv.id)} className="text-xs">PDF</Button></td>
            </tr>
          ))}</tbody></table>
        </CardContent></Card>
      )}

      <Dialog open={showCreate} onClose={() => setShowCreate(false)}>
        <div style={{ maxHeight: "70vh", overflow: "auto" }}>
          <h2 className="text-lg font-semibold mb-4">Nueva Factura · {nextNumber}</h2>
          <div className="space-y-3 mb-4">
            <div className="space-y-1"><Label>Cliente</Label><Input value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="Nombre o razón social" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Tipo Doc.</Label><select value={form.customerDocumentType} onChange={e => setForm({...form, customerDocumentType: e.target.value})} className="w-full h-10 rounded-[var(--club-radius)] border border-[var(--club-border)] px-3 text-sm bg-white"><option value="CC">CC</option><option value="NIT">NIT</option><option value="CE">CE</option><option value="PP">PP</option></select></div>
              <div className="space-y-1"><Label>Nº Documento</Label><Input value={form.customerDocument} onChange={e => setForm({...form, customerDocument: e.target.value})} placeholder="123456789" /></div>
            </div>
            <div className="space-y-1"><Label>Email</Label><Input value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} placeholder="cliente@email.com" /></div>
            <div className="border-t pt-3"><Label className="mb-2 block">Conceptos</Label>
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-2">
                  <Input className="col-span-5" value={item.description} onChange={e => { const items = [...form.items]; items[i].description = e.target.value; setForm({...form, items}); }} placeholder="Descripción" />
                  <Input className="col-span-2" type="number" value={item.quantity} onChange={e => { const items = [...form.items]; items[i].quantity = e.target.value; setForm({...form, items}); }} placeholder="Cant" />
                  <Input className="col-span-3" type="number" value={item.unitPrice} onChange={e => { const items = [...form.items]; items[i].unitPrice = e.target.value; setForm({...form, items}); }} placeholder="$ precio" />
                  <Button variant="ghost" size="sm" className="col-span-2 text-[var(--club-danger)]" onClick={() => { setForm({...form, items: form.items.filter((_, j) => j !== i)}); }}>X</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setForm({...form, items: [...form.items, { description: "", quantity: "1", unitPrice: "" }]})}>+ Añadir concepto</Button>
            </div>
          </div>
          <div className="flex gap-3"><Button className="flex-1" onClick={handleCreate}>Emitir Factura</Button><Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button></div>
        </div>
      </Dialog>
    </div>
  );
}
