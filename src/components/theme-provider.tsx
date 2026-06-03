"use client";
import { CLUB_CONFIG, THEME, themeToCSSVars } from "@/padelbacano.config";

import { createContext, useContext, useEffect, useState } from "react";
import type { ClubTheme } from "@/core/entities/club";

type ThemeContextType = {
  theme: ClubTheme;
  setTheme: (theme: Partial<ClubTheme>) => void;
};

const defaultTheme: ClubTheme = {
  primaryColor: THEME.primaryColor,
  surfaceColor: THEME.surfaceColor,
  fontFamily: THEME.fontFamily,
  logoUrl: THEME.logoUrl,
  borderRadius: THEME.borderRadius,
};

const ThemeContext = createContext<ThemeContextType>({
  theme: defaultTheme,
  setTheme: () => {},
});

export function useClubTheme() {
  return useContext(ThemeContext);
}

/** Apply CSS custom properties from theme config */
function applyThemeVars() {
  const vars = themeToCSSVars();
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  // Also set font family
  root.style.fontFamily = `'${THEME.fontFamily}', 'Saira', ui-sans-serif, system-ui, sans-serif`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ClubTheme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Apply local theme vars immediately (before API response)
  useEffect(() => {
    applyThemeVars();
  }, []);

  // Load club theme from API on mount (overrides local config)
  useEffect(() => {
    async function loadTheme() {
      try {
        const slug = CLUB_CONFIG.slug;
        const res = await fetch(`/api/club/${slug}/theme`);
        if (res.ok) {
          const data = await res.json();
          setTheme(data.theme);
          // Apply API theme to CSS vars
          applyThemeFromApi(data.theme);
        }
      } catch {
        // Keep defaults from config
      }
      setMounted(true);
    }
    loadTheme();
  }, []);

  function applyThemeFromApi(t: ClubTheme) {
    const root = document.documentElement;
    root.style.setProperty("--club-primary", t.primaryColor);
    root.style.setProperty("--club-surface", t.surfaceColor);
    root.style.setProperty(
      "--club-radius",
      { none: "0", sm: "0.25rem", md: "0.5rem", lg: "0.75rem" }[t.borderRadius]
    );
    if (t.fontFamily) {
      root.style.fontFamily = `'${t.fontFamily}', 'Saira', ui-sans-serif, system-ui, sans-serif`;
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
