import { Link, Outlet } from "@tanstack/react-router"

const NAV = [
  { to: "/", label: "Home" },
  { to: "/compare", label: "Compare" },
  { to: "/replay", label: "Replay a run" },
] as const

export const AppShell = () => (
  <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link to="/" className="text-lg font-semibold text-ink">
        Regeneration Lab
      </Link>
      <nav className="flex gap-1">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-md px-3 py-1.5 text-sm text-ink-secondary hover:bg-surface-1"
            activeProps={{ className: "bg-surface-1 text-ink font-medium" }}
            activeOptions={{ exact: true }}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
    <main className="flex-1">
      <Outlet />
    </main>
    <footer className="text-xs text-ink-muted">
      Research model. Not medical advice. Live runs here are explorations; results come from tracked
      runs.
    </footer>
  </div>
)
