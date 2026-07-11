import { forwardRef, useImperativeHandle, useRef, useState } from "react"

import { getAvatarUrl } from "@/lib/get-avatar-url"
import { cn, getInitials } from "@/lib/utils"
import type { MentionSuggestionItem } from "@/components/common/mention/mention-suggestion-item"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export type MentionSuggestionListHandle = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

type MentionSuggestionListProps = {
  items: MentionSuggestionItem[]
  command: (attrs: { id: string; label: string }) => void
}

export const MentionSuggestionList = forwardRef<
  MentionSuggestionListHandle,
  MentionSuggestionListProps
>(function MentionSuggestionList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const previousItemsRef = useRef(items)

  if (previousItemsRef.current !== items) {
    previousItemsRef.current = items
    setSelectedIndex(0)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown({ event }) {
      if (items.length === 0) return false

      if (event.key === "ArrowUp") {
        setSelectedIndex(
          (current) => (current + items.length - 1) % items.length
        )
        return true
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((current) => (current + 1) % items.length)
        return true
      }
      if (event.key === "Enter" || event.key === "Tab") {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  function selectItem(index: number) {
    const item = items[index]
    if (!item) return
    command({ id: item.id, label: item.fullName })
  }

  if (items.length === 0) {
    return (
      <div className="w-64 rounded-md border bg-popover p-2 text-sm text-muted-foreground shadow-md">
        No matches found.
      </div>
    )
  }

  return (
    <div className="flex w-64 flex-col gap-0.5 rounded-md border bg-popover p-1 shadow-md">
      {items.map((item, index) => (
        <button
          key={item.id}
          type="button"
          className={cn(
            "flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm",
            index === selectedIndex ? "bg-accent" : "hover:bg-accent"
          )}
          onClick={() => selectItem(index)}
        >
          <Avatar className="size-5">
            <AvatarImage
              src={getAvatarUrl(item.imageUrl)}
              alt={item.fullName}
            />
            <AvatarFallback className="text-[0.55rem]">
              {getInitials(item.fullName)}
            </AvatarFallback>
          </Avatar>
          {item.fullName}
        </button>
      ))}
    </div>
  )
})
