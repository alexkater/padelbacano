import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Torneos",
  description:
    "Participa en torneos de pádel del club. Eliminación directa, round robin, americano y mexicano.",
};

export default function TournamentListLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
