import { useState } from "react"

export function useDraftField<T>(value: T, onCommit: (value: T) => void) {
  const [draft, setDraft] = useState(value)
  const [lastSyncedValue, setLastSyncedValue] = useState(value)

  if (value !== lastSyncedValue) {
    // Only follow an externally changed value (e.g. a SignalR-triggered
    // refetch) when the field hasn't diverged from what we last synced -
    // otherwise an untouched field would silently commit stale text over it.
    if (draft === lastSyncedValue) {
      setDraft(value)
    }
    setLastSyncedValue(value)
  }

  function commit() {
    if (draft !== value) {
      onCommit(draft)
    }
  }

  function reset() {
    setDraft(value)
    setLastSyncedValue(value)
  }

  return { draft, setDraft, commit, reset }
}
