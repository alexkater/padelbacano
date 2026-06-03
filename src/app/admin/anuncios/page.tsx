"use client";

import { MODULE_FLAGS } from "@/padelbacano.config";
import { AdminAnnouncements } from "@/modules/social/components";
import { Card, CardContent } from "@/components/ui/card";

export default function AnnouncementsAdminPage() {
  if (!MODULE_FLAGS.social) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-[var(--club-ink)] mb-6">Anuncios del Club</h1>
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">
              El módulo de anuncios no está activado para este club.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminAnnouncements />;
}
