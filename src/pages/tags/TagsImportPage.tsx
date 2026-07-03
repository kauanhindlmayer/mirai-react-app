import { type ChangeEvent, useRef, useState } from "react"
import { useParams } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { UploadIcon } from "lucide-react"
import { toast } from "sonner"

import { createTagImportJob, listTagImportJobs } from "@/api/tag-import-jobs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn, getErrorMessage } from "@/lib/utils"
import type { Link } from "@/types/common"
import { TagImportJobStatus } from "@/types/tag-import-jobs"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const PAGE_SIZE = 10

const STATUS_COLORS: Record<TagImportJobStatus, string> = {
  [TagImportJobStatus.Pending]:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
  [TagImportJobStatus.Processing]:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  [TagImportJobStatus.Completed]:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  [TagImportJobStatus.Failed]:
    "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
}

function extractPageFromHref(href: string): number | null {
  try {
    const url = new URL(href, "http://placeholder.local")
    const page = url.searchParams.get("page")
    return page ? Number(page) : null
  } catch {
    return null
  }
}

export default function TagsImportPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["tag-import-jobs", projectId, page],
    queryFn: () =>
      listTagImportJobs(projectId!, {
        page,
        pageSize: PAGE_SIZE,
        sort: "",
        searchTerm: "",
      }),
    enabled: !!projectId,
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => createTagImportJob(projectId!, file),
    onError: (error) => {
      toast.error("Failed to start import.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tag-import-jobs", projectId],
      })
      toast.success("Import started.")
    },
  })

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large.", {
        description: "CSV files must be 10MB or smaller.",
      })
      return
    }
    uploadMutation.mutate(file)
  }

  const links = data?._links ?? []
  const nextLink = links.find((link: Link) => link.rel === "next-page")
  const previousLink = links.find((link: Link) => link.rel === "previous-page")

  function goToLink(link: Link | undefined) {
    if (!link) return
    const nextPage = extractPageFromHref(link.href)
    if (nextPage) setPage(nextPage)
  }

  const jobs = data?.items ?? []

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Import Tags</h1>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          <UploadIcon />
          Upload CSV
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Processed</TableHead>
              <TableHead className="text-right">Successful</TableHead>
              <TableHead className="text-right">Failed</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24">
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
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : jobs.length > 0 ? (
              jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="max-w-48 truncate">
                    {job.fileName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-transparent",
                        STATUS_COLORS[job.status]
                      )}
                    >
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {job.processedRecords}/{job.totalRecords}
                  </TableCell>
                  <TableCell className="text-right">
                    {job.successfulRecords}
                  </TableCell>
                  <TableCell className="text-right">
                    {job.failedRecords}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(job.createdAtUtc).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No import jobs yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {nextLink || previousLink ? (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={!previousLink}
            onClick={() => goToLink(previousLink)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {data?.page}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={!nextLink}
            onClick={() => goToLink(nextLink)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  )
}
