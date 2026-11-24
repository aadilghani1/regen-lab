import { QueryClient } from "@tanstack/react-query"
import {
  createHashHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from "@tanstack/react-router"
import { AppShell } from "./routes/app-shell.tsx"
import { ComparePage } from "./routes/compare-page.tsx"
import { HomePage } from "./routes/home-page.tsx"
import { LessonPage } from "./routes/lesson-page.tsx"
import { ReplayPage } from "./routes/replay-page.tsx"
import { ResearchPage } from "./routes/research-page.tsx"
import { ScenarioPage } from "./routes/scenario-page.tsx"
import { explorationSearch } from "./simulation/explore.ts"

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: Number.POSITIVE_INFINITY, retry: false } },
})

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: AppShell,
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage })

export const scenarioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scenario/$name",
  validateSearch: explorationSearch,
  component: ScenarioPage,
})

export const lessonRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/learn/$slug",
  validateSearch: explorationSearch,
  component: LessonPage,
})

const compareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/compare",
  component: ComparePage,
})

const replayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/replay",
  component: ReplayPage,
})

export const router = createRouter({
  routeTree: rootRoute.addChildren([
    homeRoute,
    createRoute({ getParentRoute: () => rootRoute, path: "/research", component: ResearchPage }),
    scenarioRoute,
    lessonRoute,
    compareRoute,
    replayRoute,
  ]),
  history: createHashHistory(),
  context: { queryClient },
  defaultPreload: "intent",
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
