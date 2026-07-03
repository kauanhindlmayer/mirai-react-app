import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router"
import { SearchIcon } from "lucide-react"

import { listWorkItems } from "@/api/work-items"
import { useNavMainItems } from "@/hooks/use-nav-main-items"
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
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId?: string }>()
  const navItems = useNavMainItems()

  const { data } = useQuery({
    queryKey: ["work-items", projectId, "search", query],
    queryFn: () =>
      listWorkItems(projectId!, {
        page: 1,
        pageSize: 5,
        sort: "",
        searchTerm: query,
      }),
    enabled: open && !!projectId && !!query.trim(),
    staleTime: 30_000,
  })

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

  function handleNavigate(url: string) {
    setOpen(false)
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
        onClick={() => setOpen(true)}
      >
        <SearchIcon />
        Search...
        <kbd className="ml-4 text-xs">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
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
            {navItems.flatMap((group) =>
              group.items.map((item) => (
                <CommandItem
                  key={item.url}
                  value={`${group.title} ${item.title}`}
                  onSelect={() => handleNavigate(item.url)}
                >
                  {item.icon}
                  <span className="flex-1 truncate">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {group.title}
                  </span>
                </CommandItem>
              ))
            )}
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
