import type { ButtonHTMLAttributes } from "react"
import { cn } from "../../lib/cn.ts"

type Variant = "primary" | "secondary" | "ghost"

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "border border-border bg-surface-1 text-ink hover:bg-surface-0",
  ghost: "text-ink-secondary hover:bg-surface-0",
}

export const Button = ({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { readonly variant?: Variant }) => (
  <button
    type="button"
    className={cn(
      "inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50",
      VARIANTS[variant],
      className,
    )}
    {...props}
  />
)
