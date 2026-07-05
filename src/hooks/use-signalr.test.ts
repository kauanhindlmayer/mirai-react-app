import type { HubConnection } from "@microsoft/signalr"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { waitFor } from "@testing-library/react"

vi.mock("@/lib/signalr", () => ({ createHubConnection: vi.fn() }))

import { createHubConnection } from "@/lib/signalr"
import { useSignalR } from "@/hooks/use-signalr"
import {
  createTestQueryClient,
  renderHookWithProviders,
} from "@/test/test-utils"

function buildConnection() {
  const handlers: Record<string, () => void> = {}

  const connection = {
    on: vi.fn((event: string, handler: () => void) => {
      handlers[event] = handler
    }),
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    invoke: vi.fn().mockResolvedValue("result"),
  }

  return {
    connection: connection as unknown as HubConnection,
    trigger: (event: string) => handlers[event]?.(),
    mocks: connection,
  }
}

beforeEach(() => {
  vi.mocked(createHubConnection).mockReset()
})

describe("useSignalR", () => {
  it("connects to the given hub and starts the connection", () => {
    const { connection, mocks } = buildConnection()
    vi.mocked(createHubConnection).mockReturnValue(connection)

    renderHookWithProviders(() => useSignalR("/hubs/work-items", []))

    expect(createHubConnection).toHaveBeenCalledWith("/hubs/work-items")
    expect(mocks.start).toHaveBeenCalled()
  })

  it("invalidates the paired query key when a subscribed event fires", async () => {
    const { connection, trigger } = buildConnection()
    vi.mocked(createHubConnection).mockReturnValue(connection)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries")

    renderHookWithProviders(
      () =>
        useSignalR("/hubs/work-items", [
          { event: "WorkItemUpdated", queryKey: ["work-items"] },
        ]),
      { queryClient }
    )

    trigger("WorkItemUpdated")

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["work-items"] })
    )
  })

  it("stops the connection on unmount", () => {
    const { connection, mocks } = buildConnection()
    vi.mocked(createHubConnection).mockReturnValue(connection)

    const { unmount } = renderHookWithProviders(() =>
      useSignalR("/hubs/work-items", [])
    )
    unmount()

    expect(mocks.stop).toHaveBeenCalled()
  })

  it("delegates invoke to the underlying connection", async () => {
    const { connection, mocks } = buildConnection()
    vi.mocked(createHubConnection).mockReturnValue(connection)

    const { result } = renderHookWithProviders(() =>
      useSignalR("/hubs/work-items", [])
    )
    await result.current.invoke("Ping", "hello")

    expect(mocks.invoke).toHaveBeenCalledWith("Ping", "hello")
  })
})
