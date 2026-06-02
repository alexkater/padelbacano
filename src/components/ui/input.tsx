import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-[var(--club-radius)] border border-[var(--club-border)] bg-white px-3 py-2 text-sm text-[var(--club-ink)] placeholder:text-[var(--club-ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--club-primary)] focus:border-transparent disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
