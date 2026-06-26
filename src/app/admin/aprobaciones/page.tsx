"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type OnboardingApplication = {
  id: string;
  clubName: string;
  slug: string;
  city: string;
  department: string;
  nit: string | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  status: "pending_approval" | "approved" | "rejected";
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
};

export default function AdminAprobacionesPage() {
  const [applications, setApplications] = useState<OnboardingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectApp, setRejectApp] = useState<OnboardingApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/approvals");
      if (!res.ok) {
        if (res.status === 403) throw new Error("No autorizado");
        throw new Error("Error al cargar solicitudes");
      }
      const data = await res.json();
      setApplications(data.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = useCallback(async (app: OnboardingApplication) => {
    setActionLoading(app.id);
    try {
      const res = await fetch(`/api/admin/approvals/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al aprobar");
      }
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setActionLoading(null);
    }
  }, [fetchApplications]);

  const handleReject = useCallback(async () => {
    if (!rejectApp || !rejectReason.trim()) return;
    setActionLoading(rejectApp.id);
    try {
      const res = await fetch(`/api/admin/approvals/${rejectApp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: rejectReason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al rechazar");
      }
      setRejectApp(null);
      setRejectReason("");
      await fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setActionLoading(null);
    }
  }, [rejectApp, rejectReason, fetchApplications]);

  const pendingApps = applications.filter((a) => a.status === "pending_approval");
  const reviewedApps = applications.filter((a) => a.status !== "pending_approval");

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Aprobaciones</h1>
        <p className="text-[var(--club-ink-muted)]">Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Aprobaciones de Clubes</h1>

      {error && (
        <div className="mb-4 p-3 rounded-[var(--club-radius)] bg-[var(--club-danger-bg)] text-[var(--club-danger)] text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Cerrar</button>
        </div>
      )}

      {pendingApps.length === 0 ? (
        <Card className="mb-8">
          <CardContent>
            <p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">
              No hay solicitudes pendientes de aprobación.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pendientes ({pendingApps.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]">
                  <th className="py-2 pr-4 font-medium">Club</th>
                  <th className="py-2 pr-4 font-medium">Ciudad</th>
                  <th className="py-2 pr-4 font-medium">Contacto</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Fecha</th>
                  <th className="py-2 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendingApps.map((app) => (
                  <tr key={app.id} className="border-b border-[var(--club-border)] last:border-0">
                    <td className="py-3 pr-4 text-[var(--club-ink)] font-medium">{app.clubName}</td>
                    <td className="py-3 pr-4 text-[var(--club-ink-muted)]">{app.city}, {app.department}</td>
                    <td className="py-3 pr-4 text-[var(--club-ink-muted)]">{app.contactName}</td>
                    <td className="py-3 pr-4 text-[var(--club-ink-muted)]">{app.contactEmail}</td>
                    <td className="py-3 pr-4 text-[var(--club-ink-muted)]">
                      {new Date(app.createdAt).toLocaleDateString("es-CO")}
                    </td>
                    <td className="py-3 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(app)}
                        disabled={actionLoading === app.id}
                      >
                        {actionLoading === app.id ? "..." : "Aprobar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { setRejectApp(app); setRejectReason(""); }}
                        disabled={actionLoading === app.id}
                      >
                        Rechazar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {reviewedApps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial ({reviewedApps.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]">
                  <th className="py-2 pr-4 font-medium">Club</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2 pr-4 font-medium">Contacto</th>
                  <th className="py-2 pr-4 font-medium">Revisado</th>
                  <th className="py-2 font-medium">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {reviewedApps.map((app) => (
                  <tr key={app.id} className="border-b border-[var(--club-border)] last:border-0">
                    <td className="py-3 pr-4 text-[var(--club-ink)]">{app.clubName}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        app.status === "approved"
                          ? "bg-[var(--club-success-bg)] text-[var(--club-success)]"
                          : "bg-[var(--club-danger-bg)] text-[var(--club-danger)]"
                      }`}>
                        {app.status === "approved" ? "Aprobado" : "Rechazado"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-[var(--club-ink-muted)]">{app.contactEmail}</td>
                    <td className="py-3 pr-4 text-[var(--club-ink-muted)]">
                      {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString("es-CO") : "—"}
                    </td>
                    <td className="py-3 text-[var(--club-ink-muted)]">{app.rejectionReason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Rejection reason modal */}
      <Dialog open={!!rejectApp} onClose={() => setRejectApp(null)}>
        <h3 className="text-lg font-semibold text-[var(--club-ink)] mb-2">
          Rechazar {rejectApp?.clubName}
        </h3>
        <p className="text-sm text-[var(--club-ink-muted)] mb-4">
          Indica el motivo del rechazo. Se enviará por email al contacto.
        </p>
        <textarea
          className="w-full h-24 rounded-[var(--club-radius)] border border-[var(--club-border)] bg-white p-3 text-sm text-[var(--club-ink)] placeholder:text-[var(--club-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--club-primary)] resize-none"
          placeholder="Motivo del rechazo..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setRejectApp(null)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleReject}
            disabled={!rejectReason.trim() || actionLoading === rejectApp?.id}
          >
            {actionLoading === rejectApp?.id ? "..." : "Rechazar"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
