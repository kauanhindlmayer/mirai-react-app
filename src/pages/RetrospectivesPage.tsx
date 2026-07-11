import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/common/error-state"
import { DeleteRetrospectiveDialog } from "@/components/retrospectives/delete-retrospective-dialog"
import { RetrospectiveBoard } from "@/components/retrospectives/retrospective-board"
import { RetrospectiveDialog } from "@/components/retrospectives/retrospective-dialog"
import { RetrospectiveToolbar } from "@/components/retrospectives/retrospective-toolbar"
import { useSignalR } from "@/hooks/use-signalr"
import { useCurrentTeam } from "@/hooks/use-current-team"
import {
  useDeleteRetrospectiveMutation,
  useRetrospectiveQuery,
  useRetrospectivesQuery,
} from "@/queries/retrospectives"

export default function RetrospectivesPage() {
  const { projectId, retrospectiveId: routeRetrospectiveId } = useParams<{
    projectId: string
    retrospectiveId?: string
  }>()
  const navigate = useNavigate()
  const { team, teams, isLoadingTeams, selectTeam } = useCurrentTeam(projectId)

  const retrospectivesQuery = useRetrospectivesQuery(team?.id)
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

  const retrospectiveQuery = useRetrospectiveQuery(retrospectiveId)
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

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  function openCreateDialog() {
    setDialogMode("create")
    setIsDialogOpen(true)
  }

  function openEditDialog() {
    setDialogMode("edit")
    setIsDialogOpen(true)
  }

  const deleteMutation = useDeleteRetrospectiveMutation()

  function handleDeleteRetrospective() {
    deleteMutation.mutate(retrospectiveId!, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        navigate(`/projects/${projectId}/retrospectives`, { replace: true })
      },
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <RetrospectiveToolbar
        team={team}
        teams={teams}
        isLoadingTeams={isLoadingTeams}
        onSelectTeam={selectTeam}
        retrospectives={retrospectives}
        selectedRetrospectiveId={selected?.id}
        onSelectRetrospective={(value) =>
          navigate(`/projects/${projectId}/retrospectives/${value}`)
        }
        onCreateRetrospective={openCreateDialog}
        onEditRetrospective={openEditDialog}
        onDeleteRetrospective={() => setIsDeleteDialogOpen(true)}
      />

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
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          teamId={team.id}
          retrospective={dialogMode === "edit" ? retrospective : undefined}
          onCreated={(newId) =>
            navigate(`/projects/${projectId}/retrospectives/${newId}`)
          }
        />
      ) : null}

      <DeleteRetrospectiveDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteRetrospective}
        isPending={deleteMutation.isPending}
      />
    </div>
  )
}
