"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type DialogProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

function Dialog({ open, onClose, children, className }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-[var(--club-radius-xl)] border border-[var(--club-border)] bg-white p-6 shadow-xl animate-in fade-in zoom-in",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-[var(--club-ink-muted)] hover:text-[var(--club-ink)]"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}

export { Dialog }
