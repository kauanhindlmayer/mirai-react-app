import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const TAG_COLOR_PRESETS = [
  "#2a78d6",
  "#1baf7a",
  "#eda100",
  "#008300",
  "#4a3aa7",
  "#e34948",
  "#e87ba4",
  "#eb6834",
  "#64748b",
  "#0891b2",
]

export function TagColorPicker({
  color,
  onChange,
}: {
  color: string
  onChange: (color: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [hexDraft, setHexDraft] = useState(color)

  return (
    <Popover
      open={isOpen}
      onOpenChange={(next) => {
        setIsOpen(next)
        if (next) setHexDraft(color)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="size-6 shrink-0 rounded-full border"
          style={{ backgroundColor: color }}
          aria-label="Change color"
        />
      </PopoverTrigger>
      <PopoverContent className="w-48">
        <div className="grid grid-cols-5 gap-2">
          {TAG_COLOR_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className="size-6 rounded-full border"
              style={{ backgroundColor: preset }}
              onClick={() => {
                onChange(preset)
                setIsOpen(false)
              }}
              aria-label={preset}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Input
            value={hexDraft}
            onChange={(event) => setHexDraft(event.target.value)}
            className="h-7 font-mono text-xs"
          />
          <Button
            size="sm"
            onClick={() => {
              onChange(hexDraft)
              setIsOpen(false)
            }}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
