import type { Outcome } from "@regen-lab/core"
import { cn } from "../lib/cn.ts"

const PRESENTATION: Record<Outcome, { label: string; icon: string; tone: string }> = {
  "faithful-regeneration": {
    label: "Faithful regeneration",
    icon: "✓",
    tone: "border-good text-good",
  },
  "incomplete-regeneration": {
    label: "Incomplete regeneration",
    icon: "◐",
    tone: "border-warning text-ink",
  },
  "no-regeneration": {
    label: "No regeneration",
    icon: "○",
    tone: "border-border text-ink-secondary",
  },
  duplication: { label: "Duplication", icon: "⧉", tone: "border-serious text-ink" },
  "uncontrolled-growth": {
    label: "Uncontrolled growth",
    icon: "!",
    tone: "border-critical text-critical",
  },
}

export const outcomeLabel = (outcome: Outcome): string => PRESENTATION[outcome].label

export const OutcomeBadge = ({ outcome }: { readonly outcome: Outcome }) => {
  const { label, icon, tone } = PRESENTATION[outcome]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs font-semibold",
        tone,
      )}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  )
}
