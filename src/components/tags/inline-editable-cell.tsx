import { type KeyboardEvent, useState } from "react"

import { useDraftField } from "@/hooks/use-draft-field"
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
  const field = useDraftField(value, (next) => {
    const trimmed = next.trim()
    if (trimmed !== value) onSave(trimmed)
  })

  function handleBlur() {
    setIsEditing(false)
    field.commit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur()
    }
    if (event.key === "Escape") {
      field.reset()
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        autoFocus
        value={field.draft}
        onChange={(event) => field.setDraft(event.target.value)}
        onBlur={handleBlur}
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
        field.reset()
        setIsEditing(true)
      }}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </button>
  )
}
