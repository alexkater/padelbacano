import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resultados de búsqueda — Pádel en Colombia",
  description:
    "Resultados de canchas de pádel y tenis disponibles en Colombia. Filtra por ciudad, fecha y precio.",
  openGraph: {
    title: "Resultados de búsqueda — Encuentra canchas en Colombia",
    description:
      "Explora clubes verificados con disponibilidad en tiempo real para pádel y tenis.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "PádelBacano resultados" }],
  },
};

export default function SearchResultsLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
