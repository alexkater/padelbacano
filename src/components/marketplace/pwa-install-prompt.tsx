"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, X } from "lucide-react";

/**
 * BeforeInstallPromptEvent — not in TS lib defaults.
 * Fired by Chrome when the page meets PWA installability criteria.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

/** Check if the app is already running in standalone/PWA mode */
function isAlreadyInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [userDismissed, setUserDismissed] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    setIsStandalone(isAlreadyInstalled());

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault(); // Prevent the default mini-infobar
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setJustInstalled(true);
      setDeferredPrompt(null);
      // Hide the prompt after a short delay to show success state
      setTimeout(() => setUserDismissed(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Also check getInstalledRelatedApps if supported
    if ("getInstalledRelatedApps" in navigator) {
      (navigator as Navigator & { getInstalledRelatedApps: () => Promise<{ platform: string }[]> })
        .getInstalledRelatedApps()
        .then((apps) => {
          if (apps.length > 0) {
            setIsStandalone(true);
          }
        })
        .catch(() => {
          // Silently fail — not all browsers support this
        });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (outcome === "dismissed") {
      setUserDismissed(true);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setUserDismissed(true);
  }, []);

  // Don't render if already installed, dismissed, or not available
  if (isStandalone || userDismissed || (!deferredPrompt && !justInstalled)) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[var(--pb-space-4)] left-[var(--pb-space-4)] right-[var(--pb-space-4)] z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in"
    >
      <div className="flex items-center gap-[var(--pb-space-3)] rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-4)] py-[var(--pb-space-3)] shadow-[var(--pb-shadow-card)]">
        {justInstalled ? (
          <>
            <div className="flex size-10 items-center justify-center rounded-[var(--pb-radius-sm)] bg-[var(--pb-status-success)]/10">
              <svg
                className="size-5 text-[var(--pb-status-success)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="flex-1 text-sm font-medium text-[var(--pb-text-primary)]">
              App instalada correctamente
            </p>
            <button
              onClick={handleDismiss}
              className="inline-flex size-8 items-center justify-center rounded-[var(--pb-radius-sm)] text-[var(--pb-text-tertiary)] hover:bg-[var(--pb-surface-secondary)] hover:text-[var(--pb-text-primary)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
              aria-label="Cerrar"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </>
        ) : (
          <>
            <div className="flex size-10 items-center justify-center rounded-[var(--pb-radius-sm)] bg-[var(--pb-brand-primary)] text-[var(--pb-brand-foreground)]">
              <Download className="size-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--pb-text-primary)]">
                Instalar app
              </p>
              <p className="text-xs text-[var(--pb-text-secondary)] truncate">
                Acceso rápido a tus canchas favoritas
              </p>
            </div>
            <div className="flex items-center gap-[var(--pb-space-2)] shrink-0">
              <button
                onClick={handleInstallClick}
                className="inline-flex h-9 items-center justify-center rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-3)] text-sm font-semibold text-[var(--pb-brand-foreground)] transition-colors hover:bg-[var(--pb-brand-hover)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
              >
                Instalar
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex size-9 items-center justify-center rounded-[var(--pb-radius-md)] text-[var(--pb-text-tertiary)] hover:bg-[var(--pb-surface-secondary)] hover:text-[var(--pb-text-primary)] focus-visible:outline-none focus-visible:ring-[var(--pb-ring-focus)]"
                aria-label="Cerrar"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
