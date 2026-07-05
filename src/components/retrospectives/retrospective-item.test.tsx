import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { RetrospectiveItemCard } from "@/components/retrospectives/retrospective-item"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { RetrospectiveItem } from "@/types/retrospectives"

function buildItem(
  overrides: Partial<RetrospectiveItem> = {}
): RetrospectiveItem {
  return {
    id: "item-1",
    content: "We shipped the new dashboard",
    position: 1,
    authorId: "user-1",
    votes: 0,
    createdAtUtc: "2026-01-01T12:00:00Z",
    ...overrides,
  }
}

describe("RetrospectiveItemCard", () => {
  it("renders the item's content", () => {
    renderWithProviders(
      <RetrospectiveItemCard
        retrospectiveId="retro-1"
        columnId="column-1"
        item={buildItem()}
      />
    )

    expect(screen.getByText("We shipped the new dashboard")).toBeInTheDocument()
  })

  it("does not delete the item when the confirmation is cancelled", async () => {
    let deleteRequestCount = 0
    server.use(
      http.delete(
        "*/api/retrospectives/retro-1/columns/column-1/items/item-1",
        () => {
          deleteRequestCount += 1
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderWithProviders(
      <RetrospectiveItemCard
        retrospectiveId="retro-1"
        columnId="column-1"
        item={buildItem()}
      />
    )

    await user.click(screen.getByRole("button", { name: "Delete item" }))
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(deleteRequestCount).toBe(0)
  })

  it("deletes the item when the deletion is confirmed", async () => {
    let deleteRequestCount = 0
    server.use(
      http.delete(
        "*/api/retrospectives/retro-1/columns/column-1/items/item-1",
        () => {
          deleteRequestCount += 1
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderWithProviders(
      <RetrospectiveItemCard
        retrospectiveId="retro-1"
        columnId="column-1"
        item={buildItem()}
      />
    )

    await user.click(screen.getByRole("button", { name: "Delete item" }))
    const dialog = screen.getByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })
})
