import * as React from "react"
import { cn } from "@/lib/utils"

function Button({ className, variant = "default", size = "md", ...props }: React.ComponentProps<"button"> & {
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
}) {
  const variants = {
    default: "bg-[var(--club-primary)] text-[var(--club-primary-foreground)] hover:bg-[var(--club-primary-hover)] shadow-sm",
    outline: "border border-[var(--club-border)] bg-transparent hover:bg-[var(--club-surface-alt)] text-[var(--club-ink)]",
    ghost: "hover:bg-[var(--club-surface-alt)] text-[var(--club-ink)]",
    destructive: "bg-[var(--club-danger)] text-white hover:bg-[var(--club-danger-hover)] shadow-sm",
  }
  const sizes = {
    sm: "h-8 px-3 text-sm rounded-[var(--club-radius-sm)]",
    md: "h-10 px-4 text-sm rounded-[var(--club-radius)]",
    lg: "h-12 px-6 text-base rounded-[var(--club-radius)]",
  }
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--club-primary)] disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}

export { Button }
