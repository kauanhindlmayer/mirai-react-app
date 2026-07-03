import { useState } from "react"
import { KeyboardIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "Open global search" },
  { keys: ["D"], description: "Toggle dark mode" },
]

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts">
          <KeyboardIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Quick actions available anywhere in the app.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {SHORTCUTS.map((shortcut) => (
            <li
              key={shortcut.description}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">
                {shortcut.description}
              </span>
              <span className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="rounded border bg-muted px-1.5 py-0.5 font-mono text-xs"
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
