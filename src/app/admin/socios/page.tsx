import { CLUB_CONFIG } from "@/padelbacano.config";
import { clubRepo, userRepo } from "@/infra/db/repositories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  const members = club ? await userRepo.listClubMembers(club.id) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--club-ink)]">Socios</h1>
        <Button size="sm">+ Añadir Socio</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Listado de Socios ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-sm text-[var(--club-ink-muted)] py-4 text-center">
              No hay socios registrados todavía.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--club-border)] text-left text-[var(--club-ink-muted)]">
                  <th className="py-2 font-medium">Nombre</th>
                  <th className="py-2 font-medium">Tipo</th>
                  <th className="py-2 font-medium">Rol</th>
                  <th className="py-2 font-medium">Nivel</th>
                  <th className="py-2 font-medium">Desde</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--club-border)] last:border-0">
                    <td className="py-2 text-[var(--club-ink)]">{m.displayName}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.memberType === "member" ? "bg-[var(--club-primary)]/10 text-[var(--club-primary)]" : "bg-gray-100 text-gray-600"}`}>
                        {m.memberType === "member" ? "Socio" : "No Socio"}
                      </span>
                    </td>
                    <td className="py-2 text-[var(--club-ink-muted)]">{m.role}</td>
                    <td className="py-2 text-[var(--club-ink-muted)]">{m.level ? `${m.level}/7` : "—"}</td>
                    <td className="py-2 text-[var(--club-ink-muted)]">
                      {m.joinedAt.toLocaleDateString("es-ES", { month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
