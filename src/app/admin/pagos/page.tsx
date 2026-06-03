"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MODULE_FLAGS } from "@/padelbacano.config";

type PaymentMethod = { id: string; provider: string; name: string; isEnabled: boolean };
type Gateway = { provider: string; name: string };

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700", refunded: "bg-gray-100 text-gray-700",
};

export default function PaymentsAdminPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [available, setAvailable] = useState<Gateway[]>([]);
  const [revenue, setRevenue] = useState<{ revenue: number; transactions: number }>({ revenue: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [mRes, rRes] = await Promise.all([fetch("/api/payments/methods"), fetch("/api/payments/revenue")]);
        if (mRes.ok) { const d = await mRes.json(); setMethods(d.methods); setAvailable(d.available); }
        if (rRes.ok) setRevenue(await rRes.json());
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  async function enableMethod(provider: string) {
    await fetch("/api/payments/methods", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, config: {} }) });
    const res = await fetch("/api/payments/methods");
    if (res.ok) { const d = await res.json(); setMethods(d.methods); }
  }

  if (!MODULE_FLAGS.payments) {
    return <div className="max-w-2xl"><h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Pagos</h1><Card><CardContent><p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">El módulo de pagos no está activado.</p></CardContent></Card></div>;
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Gestión de Pagos</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card><CardContent><p className="text-sm text-[var(--club-ink-muted)]">Ingresos del mes</p><p className="text-3xl font-bold text-[var(--club-primary)] mt-1">${((revenue.revenue || 0) / 100).toLocaleString("es-CO")} COP</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-[var(--club-ink-muted)]">Transacciones</p><p className="text-3xl font-bold text-[var(--club-ink)] mt-1">{revenue.transactions || 0}</p></CardContent></Card>
        <Card><CardContent><p className="text-sm text-[var(--club-ink-muted)]">Métodos activos</p><p className="text-3xl font-bold text-[var(--club-ink)] mt-1">{methods.filter(m => m.isEnabled).length}</p></CardContent></Card>
      </div>

      <Card className="mb-8">
        <CardHeader><CardTitle>Métodos de Pago Disponibles</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {available.map(g => {
              const enabled = methods.find(m => m.provider === g.provider);
              return (
                <div key={g.provider} className="flex items-center justify-between p-3 border border-[var(--club-border)] rounded-[var(--club-radius)]">
                  <div>
                    <p className="font-medium text-[var(--club-ink)]">{g.name}</p>
                    <p className="text-xs text-[var(--club-ink-muted)]">{g.provider.toUpperCase()}</p>
                  </div>
                  {enabled?.isEnabled ? (
                    <Badge variant="default" className="bg-green-100 text-green-700">Activado</Badge>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => enableMethod(g.provider)}>Activar</Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Instrucciones de Integración</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-[var(--club-ink-muted)]">
          <div>
            <h3 className="font-semibold text-[var(--club-ink)] mb-1">PSE — Pagos Seguros en Línea</h3>
            <p>Integración vía ePayco, PayU o Wompi. Configura las variables <code className="bg-gray-100 px-1 rounded">PSE_API_KEY</code> y <code className="bg-gray-100 px-1 rounded">PSE_MERCHANT_ID</code> en el archivo <code className="bg-gray-100 px-1 rounded">.env.local</code>.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--club-ink)] mb-1">Nequi / Daviplata</h3>
            <p>Requiere API keys de Bancolombia (Nequi Connect) o Davivienda. Contacta al banco para obtener credenciales de producción.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--club-ink)] mb-1">Tarjeta de Crédito</h3>
            <p>Visa, Mastercard, Amex vía ePayco, PayU, Wompi o Stripe. Configura <code className="bg-gray-100 px-1 rounded">CARD_API_KEY</code>.</p>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--club-ink)] mb-1">Efectivo</h3>
            <p>El administrador marca el pago como "pagado en el club" desde el panel. No requiere integración externa.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
