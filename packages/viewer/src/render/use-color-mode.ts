import { useSyncExternalStore } from "react"
import type { Mode } from "./palette.ts"

const QUERY = "(prefers-color-scheme: dark)"

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

const snapshot = (): Mode => (window.matchMedia(QUERY).matches ? "dark" : "light")

export const useColorMode = (): Mode => useSyncExternalStore(subscribe, snapshot, () => "light")
