import { NextResponse } from "next/server";
import { resolvePublicClubProfile } from "@/infra/tenant/public-club-profile-service";

export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ readonly slug: string }> }
) {
  const { slug } = await params;
  const profile = await resolvePublicClubProfile({ slug });

  if (profile.source === "bootstrap_fallback" && slug !== profile.config.slug) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const clubId = profile.config.clubId ?? profile.club?.id ?? profile.config.id;

  return NextResponse.json({
    id: clubId,
    name: profile.config.name,
    slug: profile.config.slug,
    pricing: {
      memberPrice: profile.config.pricing.offPeakPriceInCents,
      nonMemberPrice: profile.config.pricing.peakPriceInCents,
      currency: profile.config.pricing.currency,
    },
    theme: profile.config.theme,
    contact: profile.club?.contact ?? {
      phone: profile.config.contact.phone,
      email: profile.config.contact.email,
      whatsapp: null,
      address: profile.config.city,
      googleMapsUrl: null,
    },
    content: profile.club?.content ?? null,
    cancellationPolicy: {
      minHoursBefore: profile.config.cancellationPolicy.minHoursBefore,
      penaltyPercent: profile.config.cancellationPolicy.penaltyPercent,
      allowRefund: profile.config.cancellationPolicy.allowRefund,
    },
    courts: (profile.club?.courts ?? []).map((court) => ({
      id: court.id,
      name: court.name,
      courtType: court.courtType,
      indoor: court.indoor,
    })),
  });
}
