import { useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { UsersRoundIcon } from "lucide-react"

import { listPersonas } from "@/api/personas"
import { CreatePersonaSheet } from "@/components/create-persona-sheet"
import { ErrorState } from "@/components/error-state"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function PersonasPage() {
  const { projectId } = useParams<{ projectId: string }>()

  const personasQuery = useQuery({
    queryKey: ["personas", projectId],
    queryFn: () => listPersonas(projectId!),
    enabled: !!projectId,
    staleTime: 60_000,
    placeholderData: [],
  })
  const personas = personasQuery.data ?? []

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Personas</h1>
        {projectId ? <CreatePersonaSheet projectId={projectId} /> : null}
      </div>

      {personasQuery.isError ? (
        <ErrorState
          error={personasQuery.error}
          title="Failed to load personas"
          onRetry={() => personasQuery.refetch()}
        />
      ) : personasQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : personas.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {personas.map((persona) => (
            <Card key={persona.id}>
              <CardContent className="flex flex-col items-center gap-3 text-center">
                <Avatar className="size-16 rounded-lg">
                  <AvatarImage src={persona.imageUrl} alt={persona.name} />
                  <AvatarFallback className="rounded-lg">
                    <UsersRoundIcon className="size-6 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{persona.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
          <UsersRoundIcon className="size-10 text-muted-foreground" />
          <p className="text-sm font-medium">No personas yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Create a persona to capture your users&apos; goals and behaviors.
          </p>
        </div>
      )}
    </div>
  )
}
