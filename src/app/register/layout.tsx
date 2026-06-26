import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear cuenta",
  description:
    "Regístrate en PádelBacano para reservar canchas de pádel y tenis, participar en torneos y gestionar tu perfil.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
