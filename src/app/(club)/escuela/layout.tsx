import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Escuela de pádel",
  description:
    "Clases de pádel para todos los niveles. Entrenadores profesionales, clases grupales e individuales.",
};

export default function SchoolLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
