"use client";
import { CLUB_CONFIG } from "@/padelbacano.config";

import { createContext, useContext, useEffect, useState } from "react";
import type { ClubTheme } from "@/core/entities/club";

type ThemeContextType = {
  theme: ClubTheme;
  setTheme: (theme: Partial<ClubTheme>) => void;
};

const defaultTheme: ClubTheme = {
  primaryColor: "#1a3a2a",
  surfaceColor: "#d4eaf7",
  fontFamily: "Saira",
  logoUrl: null,
  borderRadius: "md",
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => {},
});

export function useClubTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ClubTheme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Load club theme from API on mount
  useEffect(() => {
    async function loadTheme() {
      try {
        const slug = CLUB_CONFIG.slug;
        const res = await fetch(`/api/club/${slug}/theme`);
        if (res.ok) {
          const data = await res.json();
          setTheme(data.theme);
          applyThemeCSS(data.theme);
        }
      } catch {
        // Use defaults
      }
      setMounted(true);
    }
    loadTheme();
  }, []);

  function applyThemeCSS(t: ClubTheme) {
    const root = document.documentElement;
    root.style.setProperty("--club-primary", t.primaryColor);
    root.style.setProperty("--club-surface", t.surfaceColor);
    root.style.setProperty("--club-font", t.fontFamily);
    root.style.setProperty(
      "--club-radius",
      { none: "0", sm: "0.25rem", md: "0.5rem", lg: "0.75rem" }[t.borderRadius]
    );
    if (t.fontFamily) {
      root.style.fontFamily = `'${t.fontFamily}', 'Saira', sans-serif`;
    }
  }

  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  const handleSetTheme = (partial: Partial<ClubTheme>) => {
    setTheme((prev) => ({ ...prev, ...partial }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      <style jsx global>{`
        :root {
          --club-primary: ${theme.primaryColor};
          --club-surface: ${theme.surfaceColor};
        }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
}
