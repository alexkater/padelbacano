import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi perfil",
  description:
    "Gestiona tu perfil, reservas, notificaciones y preferencias en el club.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
