import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/buscar", "/clubes", "/torneos"],
        disallow: ["/admin", "/api/", "/login", "/register", "/onboarding", "/perfil"],
      },
    ],
    sitemap: "https://padelbacano.com/sitemap.xml",
  };
}
