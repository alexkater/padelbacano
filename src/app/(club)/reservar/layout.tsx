import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reservar pista",
  description: "Consulta disponibilidad y reserva tu pista de pádel o tenis en el club.",
};

export default function BookingLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
