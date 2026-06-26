import type { Metadata } from "next";
import { tournamentRepo } from "@/infra/db/repositories";

type PageProps = {
  readonly params: Promise<{ readonly id: string }>;
};

const FORMAT_LABELS: Record<string, string> = {
  single_elimination: "Eliminación Directa",
  round_robin: "Round Robin",
  americano: "Americano",
  mexicano: "Mexicano",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const tournament = await tournamentRepo.findById(id);

  if (!tournament) {
    return {
      title: "Torneo no encontrado — PádelBacano",
      description: "El torneo que buscas no está disponible.",
    };
  }

  const formatLabel = FORMAT_LABELS[tournament.format] ?? tournament.format;
  const title = `${tournament.name} — Torneo de pádel`;
  const description =
    tournament.description ??
    `Torneo de pádel formato ${formatLabel}. Inscríbete y participa.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: tournament.name }],
      locale: "es_CO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function TournamentDetailLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
