import { useState } from "react"
import { useParams, useSearchParams } from "react-router"
import { type SortingState } from "@tanstack/react-table"

import {
  useDeleteWorkItemMutation,
  useWorkItemsQuery,
} from "@/queries/work-items"
import { WorkItemsTable } from "@/components/work-items/work-items-table"
import { Button } from "@/components/ui/button"

const PAGE_SIZE = 15

export default function WorkItemsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [sorting, setSorting] = useState<SortingState>([])
  const deleteWorkItemMutation = useDeleteWorkItemMutation(projectId!)

  const sort =
    sorting.length > 0 ? `${sorting[0].desc ? "-" : ""}${sorting[0].id}` : ""

  const { data, isLoading, isError, error, refetch } = useWorkItemsQuery(
    projectId!,
    { page, pageSize: PAGE_SIZE, sort, searchTerm: "" }
  )

  function openWorkItem(workItemId: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("workItemId", workItemId)
      return next
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Work Items</h1>
      <WorkItemsTable
        items={data?.items ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        sorting={sorting}
        onSortingChange={setSorting}
        onOpenWorkItem={openWorkItem}
        onDeleteWorkItem={(workItemId) =>
          deleteWorkItemMutation.mutate(workItemId)
        }
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
