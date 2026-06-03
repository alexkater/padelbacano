import { CLUB_CONFIG } from "@/padelbacano.config";
import type { Metadata } from "next";
import { Saira, Anton } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const saira = Saira({
  subsets: ["latin"],
  variable: "--font-club",
  weight: ["400", "500", "600", "700", "800"],
});

const anton = Anton({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: `${CLUB_CONFIG.name} — ${CLUB_CONFIG.location}`,
    template: `%s | ${CLUB_CONFIG.shortName}`,
  },
  description:
    "Plataforma de gestión de clubes de pádel y tenis. Reserva online, gestión de socios, torneos y más.",
  manifest: "/manifest.json",
  openGraph: {
    title: CLUB_CONFIG.name,
    description: `Reserva tu pista de pádel en ${CLUB_CONFIG.shortName}, ${CLUB_CONFIG.location}`,
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${saira.variable} ${anton.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
