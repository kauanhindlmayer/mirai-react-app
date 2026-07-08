import { useState } from "react"
import { Link, useParams } from "react-router"
import { TrashIcon, UploadIcon } from "lucide-react"

import { CreateTagPopover } from "@/components/tags/create-tag-popover"
import { TagsTable } from "@/components/tags/tags-table"
import { Button } from "@/components/ui/button"
import {
  useDeleteTagMutation,
  useDeleteTagsMutation,
  useTagsQuery,
  useUpdateTagMutation,
} from "@/queries/tags"

const PAGE_SIZE = 20

export default function TagsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data, isLoading, isError, error, refetch } = useTagsQuery(
    projectId!,
    {
      page,
      pageSize: PAGE_SIZE,
      sort: "",
      searchTerm: "",
    }
  )
  const tags = data?.items ?? []

  const updateTagMutation = useUpdateTagMutation(projectId!)

  const deleteTagMutation = useDeleteTagMutation(projectId!)

  const bulkDeleteMutation = useDeleteTagsMutation(projectId!)

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
              onClick={() =>
                bulkDeleteMutation.mutate(Array.from(selectedIds), {
                  onSuccess: () => setSelectedIds(new Set()),
                })
              }
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

      <TagsTable
        tags={tags}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        selectedIds={selectedIds}
        onToggleSelected={toggleSelected}
        onUpdateField={updateField}
        onDeleteTag={(tagId) => deleteTagMutation.mutate(tagId)}
      />

      {data && data.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasPreviousPage}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!data.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}
