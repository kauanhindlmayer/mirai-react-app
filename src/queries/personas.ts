import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createPersona,
  deletePersona,
  listPersonas,
  updatePersona,
} from "@/api/personas"
import { createErrorToastHandler } from "@/lib/query-helpers"
import type {
  CreatePersonaRequest,
  UpdatePersonaRequest,
} from "@/types/personas"

export function personasQueryKey(projectId: string) {
  return ["personas", projectId]
}

export function usePersonasQuery(projectId: string) {
  return useQuery({
    queryKey: personasQueryKey(projectId),
    queryFn: () => listPersonas(projectId),
    enabled: !!projectId,
    staleTime: 60_000,
    placeholderData: [],
  })
}

export function useCreatePersonaMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreatePersonaRequest) =>
      createPersona(projectId, request),
    onError: createErrorToastHandler("Failed to create persona."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personasQueryKey(projectId) })
      toast.success("Persona created.")
    },
  })
}

export function useUpdatePersonaMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      personaId,
      request,
    }: {
      personaId: string
      request: UpdatePersonaRequest
    }) => updatePersona(projectId, personaId, request),
    onError: createErrorToastHandler("Failed to update persona."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personasQueryKey(projectId) })
    },
  })
}

export function useDeletePersonaMutation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (personaId: string) => deletePersona(projectId, personaId),
    onError: createErrorToastHandler("Failed to delete persona."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: personasQueryKey(projectId) })
    },
  })
}
