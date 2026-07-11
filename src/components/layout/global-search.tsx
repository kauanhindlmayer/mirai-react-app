import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { SearchIcon } from "lucide-react"

import { useNavMainItems } from "@/hooks/use-nav-main-items"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useWorkItemsSearchQuery } from "@/queries/work-items"
import { cn } from "@/lib/utils"
import { WORK_ITEM_STATUS_COLORS } from "@/lib/work-item-colors"
import { Badge } from "@/components/ui/badge"
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
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const debouncedQuery = useDebouncedValue(query)
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId?: string }>()
  const { sections, settingsItems } = useNavMainItems()

  const { data } = useWorkItemsSearchQuery(projectId ?? "", debouncedQuery, {
    pageSize: 5,
    enabled: isOpen && !!projectId && !!debouncedQuery.trim(),
  })

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setIsOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  function handleNavigate(url: string) {
    setIsOpen(false)
    setQuery("")
    navigate(url)
  }

  function handleAskWisdomExtractor() {
    if (!query.trim() || !projectId) return
    handleNavigate(
      `/projects/${projectId}/wisdom-extractor?q=${encodeURIComponent(query)}`
    )
  }

  const workItems = data?.items ?? []

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <SearchIcon />
        Search...
        <kbd className="ml-4 text-xs">⌘K</kbd>
      </Button>
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Search pages and work items, or ask a question..."
          value={query}
          onValueChange={setQuery}
          onKeyDown={(event) => {
            if (event.key === "Enter" && workItems.length === 0) {
              handleAskWisdomExtractor()
            }
          }}
        />
        <CommandList>
          <CommandEmpty>
            {projectId
              ? "Press Enter to ask the Wisdom Extractor."
              : "Open a project to search work items."}
          </CommandEmpty>
          <CommandGroup heading="Pages">
            {sections.flatMap((section) =>
              section.items.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${section.title} ${item.title}`}
                  onSelect={() => handleNavigate(item.url)}
                >
                  {item.icon}
                  <span className="flex-1 truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {section.title}
                  </span>
                </CommandItem>
              ))
            )}
          </CommandGroup>
          <CommandGroup heading="Settings">
            {settingsItems.map((item) => (
              <CommandItem
                key={item.url}
                value={item.title}
                onSelect={() => handleNavigate(item.url)}
              >
                {item.icon}
                <span className="flex-1 truncate">{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          {query.trim() && projectId ? (
            <CommandGroup heading="Work Items">
              {workItems.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.code} ${item.title}`}
                  onSelect={() =>
                    handleNavigate(
                      `/projects/${projectId}/work-items?workItemId=${item.id}`
                    )
                  }
                >
                  <span className="text-xs text-muted-foreground">
                    #{item.code}
                  </span>
                  <span className="flex-1 truncate">{item.title}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-transparent",
                      WORK_ITEM_STATUS_COLORS[item.status]
                    )}
                  >
                    {item.status}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {query.trim() && projectId ? (
            <CommandGroup heading="Wisdom Extractor">
              <CommandItem onSelect={handleAskWisdomExtractor}>
                Ask: "{query}"
              </CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  )
}
