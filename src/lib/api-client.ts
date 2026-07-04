import axios, { type AxiosError, type AxiosResponse } from "axios"
import { toast } from "sonner"

import { clearAuthStorage, getAccessToken } from "@/lib/auth-storage"
import type { ApiErrorResponse } from "@/types/common"

const PUBLIC_PATHS = ["/users/login", "/users/register"]

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

function resolveErrorMessage(problem: ApiErrorResponse | undefined): string {
  if (!problem) return "Something went wrong."

  const validationMessages = Object.values(problem.errors ?? {}).flat()
  if (validationMessages.length > 0) return validationMessages.join(" ")

  return problem.detail ?? problem.title ?? "Something went wrong."
}

function handleUnauthorized(): void {
  toast.error("Your session has expired. Please log in again.")
  clearAuthStorage()
  window.location.href = "/login"
}

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
})

client.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token && !PUBLIC_PATHS.includes(config.url ?? "")) {
    config.headers.set("Authorization", `Bearer ${token}`)
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (!error.response) {
      return Promise.reject(error)
    }

    if (error.response.status === 401) {
      handleUnauthorized()
    }

    return Promise.reject(
      new ApiError(resolveErrorMessage(error.response.data), error.response.status)
    )
  }
)

function unwrap<T>(response: AxiosResponse<T>): T {
  if (response.status === 204) return undefined as T
  return response.data
}

export type RequestConfig = {
  headers?: Record<string, string>
  params?: Record<string, string>
  responseType?: "json" | "blob"
}

export async function get<T>(
  path: string,
  config?: RequestConfig
): Promise<T> {
  return unwrap(await client.get<T>(path, config))
}

export async function post<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return unwrap(await client.post<T>(path, body, config))
}

export async function put<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return unwrap(await client.put<T>(path, body, config))
}

export async function patch<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return unwrap(await client.patch<T>(path, body, config))
}

export async function del<T>(
  path: string,
  config?: RequestConfig
): Promise<T> {
  return unwrap(await client.delete<T>(path, config))
}

export async function delWithBody<T>(
  path: string,
  body: unknown,
  config?: RequestConfig
): Promise<T> {
  return unwrap(await client.delete<T>(path, { ...config, data: body }))
}
