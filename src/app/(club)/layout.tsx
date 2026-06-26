import { headers } from "next/headers";
import { ClubShell } from "./club-shell";
import { resolvePublicClubProfile } from "@/infra/tenant/public-club-profile-service";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const profile = await resolvePublicClubProfile({ headers: requestHeaders });

  const name = profile.config.name;
  const city = profile.config.city;
  const description =
    profile.club?.content.hero.description ?? `Reserva tu pista de pádel en ${name}, ${city}. Club verificado en PádelBacano.`;
  const heroImage = profile.config.contact.heroImageUrl;

  return {
    title: {
      default: `${name} — Pádel en ${city}`,
      template: `%s | ${name} — ${city}`,
    },
    description,
    openGraph: {
      title: `${name} — Pádel en ${city}`,
      description,
      images: heroImage
        ? [{ url: heroImage, width: 1200, height: 630, alt: name }]
        : [{ url: "/og-image.jpg", width: 1200, height: 630, alt: name }],
      locale: "es_CO",
      type: "website",
      siteName: name,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} — Pádel en ${city}`,
      description,
      images: heroImage ? [heroImage] : ["/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ClubLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const profile = await resolvePublicClubProfile({ headers: requestHeaders });

  return <ClubShell profile={profile}>{children}</ClubShell>;
}
