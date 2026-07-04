/* eslint-disable react-refresh/only-export-components */
import type { ReactElement, ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from "@testing-library/react"
import { MemoryRouter } from "react-router"

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

type ProvidersOptions = {
  route?: string
  queryClient?: QueryClient
}

function createWrapper({ route = "/", queryClient }: ProvidersOptions) {
  const client = queryClient ?? createTestQueryClient()

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

type RenderWithProvidersOptions = RenderOptions & ProvidersOptions

export function renderWithProviders(
  ui: ReactElement,
  { route, queryClient, ...renderOptions }: RenderWithProvidersOptions = {}
) {
  return render(ui, {
    wrapper: createWrapper({ route, queryClient }),
    ...renderOptions,
  })
}

type RenderHookWithProvidersOptions<Props> = RenderHookOptions<Props> &
  ProvidersOptions

export function renderHookWithProviders<Result, Props>(
  callback: (props: Props) => Result,
  {
    route,
    queryClient,
    ...renderHookOptions
  }: RenderHookWithProvidersOptions<Props> = {}
) {
  return renderHook(callback, {
    wrapper: createWrapper({ route, queryClient }),
    ...renderHookOptions,
  })
}

export * from "@testing-library/react"
export { createTestQueryClient }
