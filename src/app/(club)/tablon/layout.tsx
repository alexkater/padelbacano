import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tablón de socios",
  description:
    "Tablón comunitario del club. Anuncios, partidos abiertos y novedades para socios.",
};

export default function PartnerBoardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
