import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusIcon, XIcon } from "lucide-react"

import { listTags } from "@/api/tags"
import { useAddWorkItemTag, useRemoveWorkItemTag } from "@/queries/work-items"
import type { TagBriefResponse } from "@/types/work-items"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type WorkItemTagsEditorProps = {
  projectId: string
  workItemId: string
  tags: TagBriefResponse[]
}

export function WorkItemTagsEditor({
  projectId,
  workItemId,
  tags,
}: WorkItemTagsEditorProps) {
  const [open, setOpen] = useState(false)
  const addTag = useAddWorkItemTag(projectId, workItemId)
  const removeTag = useRemoveWorkItemTag(projectId, workItemId)

  const availableTagsQuery = useQuery({
    queryKey: ["tags", projectId],
    queryFn: () =>
      listTags(projectId, { page: 1, pageSize: 100, sort: "", searchTerm: "" }),
    enabled: open,
    staleTime: 60_000,
  })

  const tagNames = new Set(tags.map((tag) => tag.name))

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          style={{ backgroundColor: tag.color }}
          className="gap-1 text-white"
        >
          {tag.name}
          <button
            type="button"
            onClick={() => removeTag.mutate(tag.name)}
            aria-label={`Remove ${tag.name}`}
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
          >
            <PlusIcon className="size-3" />
            Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {(availableTagsQuery.data?.items ?? []).map((tag) => {
                  const isAdded = tagNames.has(tag.name)
                  return (
                    <CommandItem
                      key={tag.id}
                      onSelect={() => {
                        if (isAdded) {
                          removeTag.mutate(tag.name)
                        } else {
                          addTag.mutate(tag.name)
                        }
                      }}
                    >
                      <span
                        className="mr-2 size-2.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                      {isAdded ? (
                        <span className="ml-auto text-xs text-muted-foreground">
                          Added
                        </span>
                      ) : null}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
