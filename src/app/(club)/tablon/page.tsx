"use client";

import { MODULE_FLAGS } from "@/padelbacano.config";
import { PartnerBoard } from "@/modules/social/components";
import { Card, CardContent } from "@/components/ui/card";

export default function PartnerBoardPage() {
  if (!MODULE_FLAGS.social) {
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
