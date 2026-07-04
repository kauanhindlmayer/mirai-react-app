import { useState } from "react"

export function useDraftField<T>(value: T, onCommit: (value: T) => void) {
  const [draft, setDraft] = useState(value)

  function commit() {
    if (draft !== value) {
      onCommit(draft)
    }
  }

  function reset() {
    setDraft(value)
  }

  return { draft, setDraft, commit, reset }
}
