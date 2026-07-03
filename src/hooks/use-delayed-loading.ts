import { useEffect, useState } from "react"

const DEFAULT_DELAY_MS = 200

/**
 * Delays surfacing a loading state by `delayMs` so fast requests don't flash
 * a spinner. Mirrors the 200ms delay used throughout the current Vue app.
 */
export function useDelayedLoading(
  isLoading: boolean,
  delayMs: number = DEFAULT_DELAY_MS
): boolean {
  const [isDelayedLoading, setIsDelayedLoading] = useState(false)

  useEffect(() => {
    if (!isLoading) return

    const timeoutId = setTimeout(() => setIsDelayedLoading(true), delayMs)
    return () => {
      clearTimeout(timeoutId)
      setIsDelayedLoading(false)
    }
  }, [isLoading, delayMs])

  return isDelayedLoading
}
