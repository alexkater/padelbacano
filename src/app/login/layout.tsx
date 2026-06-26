import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Accede a tu cuenta de PádelBacano para gestionar reservas, torneos y perfil.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
