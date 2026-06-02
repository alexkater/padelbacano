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
    default: "El Remate Padel Club — Sevilla",
    template: "%s | El Remate Padel Club",
  },
  description:
    "11 pistas indoor de cristal cubiertas en Sevilla. Reserva online, escuela de pádel, torneos y partidos nivelados.",
  manifest: "/manifest.json",
  openGraph: {
    title: "El Remate Padel Club",
    description: "Reserva tu pista de pádel en El Remate, Sevilla",
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
