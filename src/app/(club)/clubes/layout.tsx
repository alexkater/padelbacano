import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clubes de pádel",
  description: "Explora clubes de pádel y tenis disponibles. Encuentra el tuyo y reserva pista.",
};

export default function ClubesLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
