import { useState } from "react"
import { useParams, useSearchParams } from "react-router"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"

import { useDeleteWorkItemMutation, useWorkItemsQuery } from "@/queries/work-items"
import {
  WORK_ITEM_STATUS_COLORS,
  WORK_ITEM_TYPE_COLORS,
} from "@/lib/work-item-colors"
import { cn, getErrorMessage } from "@/lib/utils"
import type { WorkItemSummary } from "@/types/work-items"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 20

const columns: ColumnDef<WorkItemSummary>[] = [
  {
    accessorKey: "code",
    header: "ID",
    cell: ({ row }) => `#${row.original.code}`,
  },
  { accessorKey: "title", header: "Title" },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          "border-transparent",
          WORK_ITEM_TYPE_COLORS[row.original.type]
        )}
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={cn(
          "border-transparent",
          WORK_ITEM_STATUS_COLORS[row.original.status]
        )}
      >
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: "assignee",
    header: "Assignee",
    enableSorting: false,
    cell: ({ row }) => row.original.assignee?.name ?? "Unassigned",
  },
  {
    id: "tags",
    header: "Tags",
    enableSorting: false,
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags.map((tag) => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color }}
            className="text-white"
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    ),
  },
]

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

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  })

  function openWorkItem(workItemId: string) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set("workItemId", workItemId)
      return next
    })
  }

  async function copyLink(workItemId: string) {
    const url = new URL(window.location.href)
    url.searchParams.set("workItemId", workItemId)
    await navigator.clipboard.writeText(url.toString())
    toast.success("Link copied.")
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <h1 className="text-xl font-semibold">Work Items</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : undefined
                    }
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{ asc: " ↑", desc: " ↓" }[
                      header.column.getIsSorted() as string
                    ] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24">
                  <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                    <span className="text-sm">{getErrorMessage(error)}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <ContextMenu key={row.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => openWorkItem(row.original.id!)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => copyLink(row.original.id!)}>
                      Copy link
                    </ContextMenuItem>
                    <ContextMenuItem
                      variant="destructive"
                      onClick={() =>
                        deleteWorkItemMutation.mutate(row.original.id!)
                      }
                    >
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No work items yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
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
