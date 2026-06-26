import type { Metadata } from "next";
import { marketplaceSearchRepo } from "@/infra/db/repositories";

type PageProps = {
  readonly params: Promise<{ readonly slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const club = await marketplaceSearchRepo.getClubDetail(slug);

  if (!club) {
    return {
      title: "Club no encontrado — PádelBacano",
      description: "El club que buscas no está disponible en el marketplace.",
    };
  }

  const title = `${club.name} — Pádel en ${club.city}`;
  const description = club.description ?? `Reserva tu pista en ${club.name}, ${club.city}. Canchas de pádel y tenis en Colombia.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: club.photos.length > 0
        ? club.photos.map((photo) => ({ url: photo, width: 1200, height: 630, alt: club.name }))
        : [{ url: "/og-image.jpg", width: 1200, height: 630, alt: club.name }],
      locale: "es_CO",
      type: "website",
      siteName: club.name,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: club.photos.length > 0 ? [club.photos[0]] : ["/og-image.jpg"],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function MarketplaceClubLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
