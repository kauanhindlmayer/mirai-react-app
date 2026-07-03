import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId?: string }>()

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  function handleSubmit() {
    if (!query.trim() || !projectId) return
    setOpen(false)
    navigate(
      `/projects/${projectId}/wisdom-extractor?q=${encodeURIComponent(query)}`
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
        Search...
        <kbd className="ml-4 text-xs">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Ask the Wisdom Extractor..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSubmit()
          }}
        />
        <CommandList>
          <CommandEmpty>
            {projectId
              ? "Press Enter to search with the Wisdom Extractor."
              : "Open a project to search."}
          </CommandEmpty>
          {query && projectId ? (
            <CommandGroup heading="Wisdom Extractor">
              <CommandItem onSelect={handleSubmit}>Ask: "{query}"</CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  )
}
