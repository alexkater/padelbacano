import * as React from "react"
import { cn } from "@/lib/utils"

function Badge({ className, variant = "default", ...props }: React.ComponentProps<"span"> & {
  variant?: "default" | "outline" | "success" | "warning"
}) {
  const variants = {
    default: "bg-[var(--club-primary)] text-[var(--club-primary-foreground)]",
    outline: "border border-[var(--club-border)] text-[var(--club-ink)]",
    success: "bg-[var(--club-primary)]/10 text-[var(--club-primary)]",
    warning: "bg-[var(--club-warning-bg)] text-[var(--club-warning)]",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
