import { del, get, post, put } from "@/lib/api-client"
import type {
  CreatePersonaRequest,
  PersonaBriefResponse,
  UpdatePersonaRequest,
} from "@/types/personas"

function toFormData(
  request: CreatePersonaRequest | UpdatePersonaRequest
): FormData {
  const formData = new FormData()
  formData.append("name", request.name)
  if (request.description) formData.append("description", request.description)
  if (request.file) formData.append("file", request.file)
  return formData
}

export function createPersona(
  projectId: string,
  request: CreatePersonaRequest
): Promise<string> {
  return post(`/projects/${projectId}/personas`, toFormData(request))
}

export function getPersona(
  projectId: string,
  personaId: string
): Promise<string> {
  return get(`/projects/${projectId}/personas/${personaId}`)
}

export function listPersonas(
  projectId: string
): Promise<PersonaBriefResponse[]> {
  return get(`/projects/${projectId}/personas`)
}

export function updatePersona(
  projectId: string,
  personaId: string,
  request: UpdatePersonaRequest
): Promise<void> {
  return put(
    `/projects/${projectId}/personas/${personaId}`,
    toFormData(request)
  )
}

export function deletePersona(
  projectId: string,
  personaId: string
): Promise<void> {
  return del(`/projects/${projectId}/personas/${personaId}`)
}
