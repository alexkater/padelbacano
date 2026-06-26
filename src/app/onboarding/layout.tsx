import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registra tu club en el marketplace",
  description:
    "Completa el formulario de onboarding para registrar tu club de pádel o tenis en el marketplace PádelBacano en Colombia.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  return children;
}
