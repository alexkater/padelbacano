"use client";

import { PartnerBoard } from "@/modules/social/components";
import { Card, CardContent } from "@/components/ui/card";
import { useClubTenant } from "@/components/club/club-tenant-provider";

export default function PartnerBoardPage() {
  const tenant = useClubTenant();

  if (!tenant.modules.social) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent>
            <p className="text-sm text-[var(--club-ink-muted)] py-8 text-center">
              Esta funcionalidad no está disponible en este club.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <PartnerBoard />
    </div>
  );
}
