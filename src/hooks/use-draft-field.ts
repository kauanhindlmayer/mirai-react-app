import { useState } from "react"

export function useDraftField<T>(value: T, onCommit: (value: T) => void) {
  const [draft, setDraft] = useState(value)
  const [lastSyncedValue, setLastSyncedValue] = useState(value)

  if (value !== lastSyncedValue) {
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
