import {
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { toast } from "sonner"

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

type WorkItemsTableProps = {
  items: WorkItemSummary[]
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  onOpenWorkItem: (workItemId: string) => void
  onDeleteWorkItem: (workItemId: string) => void
}

export function WorkItemsTable({
  items,
  isLoading,
  isError,
  error,
  onRetry,
  sorting,
  onSortingChange,
  onOpenWorkItem,
  onDeleteWorkItem,
}: WorkItemsTableProps) {
  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  })

  async function copyLink(workItemId: string) {
    const url = new URL(window.location.href)
    url.searchParams.set("workItemId", workItemId)
    await navigator.clipboard.writeText(url.toString())
    toast.success("Link copied.")
  }

  return (
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
                  <Button variant="outline" size="sm" onClick={onRetry}>
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
                    onClick={() => onOpenWorkItem(row.original.id!)}
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
                    onClick={() => onDeleteWorkItem(row.original.id!)}
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
  )
}
