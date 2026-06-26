import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next", // Note: change to ".next-custom" if .next has permission issues
  turbopack: {
    root: process.cwd(),
  },
  serverExternalPackages: ["better-sqlite3"],

  // Optimise images: allow remote patterns from Unsplash and any configured CDN
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.padelbacano.test",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
