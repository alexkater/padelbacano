import type { Metadata } from "next";
import { Saira, Anton } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaInstallPrompt } from "@/components/marketplace/pwa-install-prompt";
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

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "PádelBacano — Marketplace de pádel y tenis en Colombia",
    template: "%s — PádelBacano",
  },
  description:
    "Encuentra y reserva canchas de pádel y tenis en Colombia. Marketplace con clubes verificados, torneos, escuela y gestión deportiva.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "PádelBacano",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "PádelBacano — Marketplace de pádel y tenis en Colombia",
    description:
      "Encuentra y reserva canchas de pádel y tenis en Colombia. Clubes verificados, mejores precios y disponibilidad en tiempo real.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PádelBacano — Marketplace de pádel",
      },
    ],
    locale: "es_CO",
    type: "website",
    siteName: "PádelBacano",
  },
  twitter: {
    card: "summary_large_image",
    title: "PádelBacano — Marketplace de pádel y tenis en Colombia",
    description:
      "Encuentra y reserva canchas de pádel y tenis en Colombia. Clubes verificados, mejores precios y disponibilidad en tiempo real.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
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
        <ThemeProvider>
          {children}
          <PwaInstallPrompt />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(function () {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
