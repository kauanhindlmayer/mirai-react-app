import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  EllipsisIcon,
  LinkIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  deleteRetrospective,
  getRetrospective,
  listRetrospectives,
} from "@/api/retrospectives"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import { RetrospectiveBoard } from "@/components/retrospectives/retrospective-board"
import { RetrospectiveDialog } from "@/components/retrospectives/retrospective-dialog"
import { useSignalR } from "@/hooks/use-signalr"
import { useTeamContext } from "@/hooks/use-team-context"

export default function RetrospectivesPage() {
  const { projectId, retrospectiveId: routeRetrospectiveId } = useParams<{
    projectId: string
    retrospectiveId?: string
  }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { team, teams, isLoadingTeams, selectTeam } = useTeamContext(projectId)

  const retrospectivesQuery = useQuery({
    queryKey: ["retrospectives", team?.id],
    queryFn: () => listRetrospectives(team!.id),
    enabled: !!team?.id,
    staleTime: 60_000,
    placeholderData: [],
  })
  const retrospectives = retrospectivesQuery.data ?? []

  const selected =
    retrospectives.find((r) => r.id === routeRetrospectiveId) ??
    retrospectives[0] ??
    null
  const retrospectiveId = selected?.id

  useEffect(() => {
    if (!projectId || !selected) return
    if (routeRetrospectiveId === selected.id) return
    navigate(`/projects/${projectId}/retrospectives/${selected.id}`, {
      replace: true,
    })
  }, [projectId, selected, routeRetrospectiveId, navigate])

  const retrospectiveQuery = useQuery({
    queryKey: ["retrospective", retrospectiveId],
    queryFn: () => getRetrospective(retrospectiveId!),
    enabled: !!retrospectiveId,
  })
  const retrospective = retrospectiveQuery.data

  const signalREvents = useMemo(
    () =>
      retrospectiveId
        ? [
            {
              event: "send-retrospective-item",
              queryKey: ["retrospective", retrospectiveId],
            },
            {
              event: "delete-retrospective-item",
              queryKey: ["retrospective", retrospectiveId],
            },
          ]
        : [],
    [retrospectiveId]
  )
  useSignalR("/hubs/retrospective", signalREvents)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  function openCreateDialog() {
    setDialogMode("create")
    setDialogOpen(true)
  }

  function openEditDialog() {
    setDialogMode("edit")
    setDialogOpen(true)
  }

  function copyRetrospectiveLink() {
    navigator.clipboard.writeText(window.location.href)
    toast.success(
      "The link to the retrospective has been copied to the clipboard."
    )
  }

  const deleteMutation = useMutation({
    mutationFn: () => deleteRetrospective(retrospectiveId!),
    onError: (error) => {
      toast.error("Failed to delete retrospective.", {
        description:
          error instanceof Error ? error.message : "Something went wrong.",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retrospectives", team?.id] })
      toast.success("Retrospective deleted.")
      setDeleteDialogOpen(false)
      navigate(`/projects/${projectId}/retrospectives`, { replace: true })
    },
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <Select
          value={team?.id}
          onValueChange={(value) => {
            const nextTeam = teams.find((t) => t.id === value)
            if (nextTeam) selectTeam(nextTeam)
          }}
        >
          <SelectTrigger className="w-56">
            <SelectValue
              placeholder={isLoadingTeams ? "Loading teams…" : "Select a team"}
            />
          </SelectTrigger>
          <SelectContent>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {retrospectives.length > 0 ? (
          <div className="flex items-center gap-2">
            <Select
              value={selected?.id}
              onValueChange={(value) =>
                navigate(`/projects/${projectId}/retrospectives/${value}`)
              }
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select a retrospective" />
              </SelectTrigger>
              <SelectContent>
                {retrospectives.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Board actions">
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={openCreateDialog}>
                  <PlusIcon />
                  Create New Retrospective
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={openEditDialog}>
                  <PencilIcon />
                  Edit Retrospective
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={copyRetrospectiveLink}>
                  <LinkIcon />
                  Copy Retrospective Link
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteDialogOpen(true)}
                >
                  <TrashIcon />
                  Delete Retrospective
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>

      {retrospectivesQuery.isError ? (
        <ErrorState
          error={retrospectivesQuery.error}
          title="Failed to load retrospectives"
          onRetry={() => retrospectivesQuery.refetch()}
        />
      ) : retrospectiveQuery.isError ? (
        <ErrorState
          error={retrospectiveQuery.error}
          title="Failed to load retrospective"
          onRetry={() => retrospectiveQuery.refetch()}
        />
      ) : retrospective ? (
        <RetrospectiveBoard retrospective={retrospective} />
      ) : retrospectiveQuery.isLoading ? (
        <div className="flex flex-1 gap-4">
          <Skeleton className="h-96 w-64" />
          <Skeleton className="h-96 w-64" />
          <Skeleton className="h-96 w-64" />
        </div>
      ) : (
        <div className="mt-16 flex flex-1 flex-col items-center gap-2 text-center">
          <h2 className="text-xl font-semibold">
            Get started with your first Retrospective
          </h2>
          <p className="text-sm text-muted-foreground">
            Create a new board to start collecting feedback and insights.
          </p>
          <Button className="mt-4" onClick={openCreateDialog}>
            <PlusIcon />
            Create Board
          </Button>
        </div>
      )}

      {team ? (
        <RetrospectiveDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          teamId={team.id}
          retrospective={dialogMode === "edit" ? retrospective : undefined}
          onCreated={(newId) =>
            navigate(`/projects/${projectId}/retrospectives/${newId}`)
          }
        />
      ) : null}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Retrospective</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this retrospective? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
