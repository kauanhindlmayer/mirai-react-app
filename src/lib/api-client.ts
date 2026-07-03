import { toast } from "sonner"

import { clearAuthStorage, getAccessToken } from "@/lib/auth-storage"
import type { ApiErrorResponse } from "@/types/common"

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`

const PUBLIC_PATHS = ["/users/login", "/users/register"]

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

export type RequestConfig = {
  headers?: Record<string, string>
  params?: Record<string, string>
  responseType?: "json" | "blob"
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(API_BASE_URL + path)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

function handleUnauthorized(): void {
  toast.error("Your session has expired. Please log in again.")
  clearAuthStorage()
  window.location.href = "/login"
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  const isFormData = body instanceof FormData
  const headers: Record<string, string> = { ...config?.headers }

  if (!isFormData && body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  const token = getAccessToken()
  if (token && !PUBLIC_PATHS.includes(path)) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, config?.params), {
    method,
    headers,
    body: isFormData
      ? body
      : body !== undefined
        ? JSON.stringify(body)
        : undefined,
  })

  if (response.status === 401) {
    handleUnauthorized()
  }

  if (!response.ok) {
    const problem = (await response
      .json()
      .catch(() => null)) as ApiErrorResponse | null
    throw new ApiError(
      problem?.title ?? "Something went wrong.",
      response.status
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (config?.responseType === "blob") {
    return (await response.blob()) as T
  }

  return (await response.json()) as T
}

export function get<T>(path: string, config?: RequestConfig): Promise<T> {
  return request<T>("GET", path, undefined, config)
}

export function post<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>("POST", path, body, config)
}

export function put<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>("PUT", path, body, config)
}

export function patch<T>(
  path: string,
  body?: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>("PATCH", path, body, config)
}

export function del<T>(path: string, config?: RequestConfig): Promise<T> {
  return request<T>("DELETE", path, undefined, config)
}

export function delWithBody<T>(
  path: string,
  body: unknown,
  config?: RequestConfig
): Promise<T> {
  return request<T>("DELETE", path, body, config)
}
