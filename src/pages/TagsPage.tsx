import { useState } from "react"
import { Link, useParams } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TrashIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { deleteTag, deleteTags, listTags, updateTag } from "@/api/tags"
import { CreateTagPopover } from "@/components/tags/create-tag-popover"
import { InlineEditableCell } from "@/components/tags/inline-editable-cell"
import { TagColorPicker } from "@/components/tags/tag-color-picker"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getErrorMessage } from "@/lib/utils"

const PAGE_SIZE = 20

export default function TagsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const tagsQuery = useQuery({
    queryKey: ["tags", projectId, page],
    queryFn: () =>
      listTags(projectId!, {
        page,
        pageSize: PAGE_SIZE,
        sort: "",
        searchTerm: "",
      }),
    enabled: !!projectId,
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  })
  const tags = tagsQuery.data?.items ?? []

  const updateTagMutation = useMutation({
    mutationFn: ({
      tagId,
      request,
    }: {
      tagId: string
      request: { name: string; description: string; color: string }
    }) => updateTag(projectId!, tagId, request),
    onError: (error) => {
      toast.error("Failed to update tag.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", projectId] })
    },
  })

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: string) => deleteTag(projectId!, tagId),
    onError: (error) => {
      toast.error("Failed to delete tag.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", projectId] })
      toast.success("Tag deleted.")
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (tagIds: string[]) => deleteTags(projectId!, tagIds),
    onError: (error) => {
      toast.error("Failed to delete tags.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags", projectId] })
      toast.success("Tags deleted.")
      setSelectedIds(new Set())
    },
  })

  function updateField(
    tag: (typeof tags)[number],
    field: "name" | "description" | "color",
    value: string
  ) {
    updateTagMutation.mutate({
      tagId: tag.id,
      request: {
        name: field === "name" ? value : tag.name,
        description: field === "description" ? value : (tag.description ?? ""),
        color: field === "color" ? value : tag.color,
      },
    })
  }

  function toggleSelected(tagId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) {
        next.delete(tagId)
      } else {
        next.add(tagId)
      }
      return next
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tags</h1>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
              disabled={bulkDeleteMutation.isPending}
            >
              <TrashIcon />
              Delete {selectedIds.size} tag{selectedIds.size !== 1 ? "s" : ""}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link to={`/projects/${projectId}/tags/import`}>
              <UploadIcon />
              Import
            </Link>
          </Button>
          {projectId ? <CreateTagPopover projectId={projectId} /> : null}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Work items</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tagsQuery.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24">
                  <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                    <span className="text-sm">
                      {getErrorMessage(tagsQuery.error)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => tagsQuery.refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : tagsQuery.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : tags.length > 0 ? (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(tag.id)}
                      onCheckedChange={() => toggleSelected(tag.id)}
                      aria-label={`Select ${tag.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <TagColorPicker
                      color={tag.color}
                      onChange={(color) => updateField(tag, "color", color)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineEditableCell
                      value={tag.name}
                      onSave={(value) => updateField(tag, "name", value)}
                    />
                  </TableCell>
                  <TableCell>
                    <InlineEditableCell
                      value={tag.description ?? ""}
                      onSave={(value) => updateField(tag, "description", value)}
                      placeholder="Add a description"
                    />
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {tag.workItemsCount}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => deleteTagMutation.mutate(tag.id)}
                      aria-label={`Delete ${tag.name}`}
                    >
                      <TrashIcon className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No tags yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {tagsQuery.data && tagsQuery.data.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!tagsQuery.data.hasPreviousPage}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {tagsQuery.data.page} of {tagsQuery.data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!tagsQuery.data.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}
