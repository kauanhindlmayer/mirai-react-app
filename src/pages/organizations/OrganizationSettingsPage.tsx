import { useState } from "react"
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { useCurrentOrganization } from "@/hooks/use-current-organization"
import { useOrganizationUsersQuery } from "@/queries/organizations"
import { InviteUserDialog } from "@/components/organizations/invite-user-dialog"
import type { OrganizationUserResponse } from "@/types/organizations"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAvatarUrl } from "@/lib/get-avatar-url"
import { getErrorMessage, getInitials } from "@/lib/utils"

const PAGE_SIZE = 10

const columns: ColumnDef<OrganizationUserResponse>[] = [
  {
    accessorKey: "fullName",
    header: "Member",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar className="size-7">
          <AvatarImage
            src={getAvatarUrl(row.original.imageUrl)}
            alt={row.original.fullName}
          />
          <AvatarFallback>{getInitials(row.original.fullName)}</AvatarFallback>
        </Avatar>
        <span className="font-medium">{row.original.fullName}</span>
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "lastActiveAtUtc",
    header: "Last active",
    cell: ({ row }) =>
      row.original.lastActiveAtUtc
        ? new Date(row.original.lastActiveAtUtc).toLocaleDateString()
        : "—",
  },
]

export default function OrganizationSettingsPage() {
  const { organizationId, organization } = useCurrentOrganization()
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } =
    useOrganizationUsersQuery(organizationId!, {
      page,
      pageSize: PAGE_SIZE,
      sort: "",
      searchTerm: "",
    })

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {organization?.name ?? "Organization"} — Settings
        </h1>
        {organizationId ? (
          <InviteUserDialog organizationId={organizationId} />
        ) : null}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No members yet.
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
