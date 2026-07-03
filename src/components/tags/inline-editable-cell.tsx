import { type KeyboardEvent, useState } from "react"

import { Input } from "@/components/ui/input"

type InlineEditableCellProps = {
  value: string
  onSave: (value: string) => void
  placeholder?: string
}

export function InlineEditableCell({
  value,
  onSave,
  placeholder,
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function commit() {
    setIsEditing(false)
    if (draft.trim() !== value) {
      onSave(draft.trim())
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur()
    }
    if (event.key === "Escape") {
      setDraft(value)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="h-7"
      />
    )
  }

  return (
    <button
      type="button"
      className="w-full rounded px-2 py-1 text-left hover:bg-accent"
      onClick={() => {
        setDraft(value)
        setIsEditing(true)
      }}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </button>
  )
}
