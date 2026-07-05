import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { RetrospectiveColumnCard } from "@/components/retrospectives/retrospective-column"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { RetrospectiveColumn } from "@/types/retrospectives"

function buildColumn(
  overrides: Partial<RetrospectiveColumn> = {}
): RetrospectiveColumn {
  return {
    id: "column-1",
    title: "Went Well",
    position: 1,
    items: [],
    ...overrides,
  }
}

describe("RetrospectiveColumnCard", () => {
  it("renders the column title and existing items", () => {
    renderWithProviders(
      <RetrospectiveColumnCard
        retrospectiveId="retro-1"
        column={buildColumn({
          items: [
            {
              id: "item-1",
              content: "Great teamwork",
              position: 1,
              authorId: "user-1",
              votes: 0,
              createdAtUtc: "2026-01-01T00:00:00Z",
            },
          ],
        })}
      />
    )

    expect(screen.getByText("Went Well")).toBeInTheDocument()
    expect(screen.getByText("Great teamwork")).toBeInTheDocument()
  })

  it("shows an add-item textarea when Add New Item is clicked", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RetrospectiveColumnCard
        retrospectiveId="retro-1"
        column={buildColumn()}
      />
    )

    await user.click(screen.getByRole("button", { name: /add new item/i }))

    expect(
      screen.getByPlaceholderText("Write a feedback item…")
    ).toBeInTheDocument()
  })

  it("shows a validation error for content shorter than 3 characters", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RetrospectiveColumnCard
        retrospectiveId="retro-1"
        column={buildColumn()}
      />
    )

    await user.click(screen.getByRole("button", { name: /add new item/i }))
    await user.type(screen.getByPlaceholderText("Write a feedback item…"), "hi")
    await user.keyboard("{Enter}")

    expect(
      await screen.findByText("Content must be at least 3 characters.")
    ).toBeInTheDocument()
  })

  it("submits a new item on Enter and closes the form", async () => {
    let requestBody: unknown
    server.use(
      http.post(
        "*/api/retrospectives/retro-1/columns/column-1/items",
        async ({ request }) => {
          requestBody = await request.json()
          return HttpResponse.json("item-2")
        }
      )
    )

    const user = userEvent.setup()
    renderWithProviders(
      <RetrospectiveColumnCard
        retrospectiveId="retro-1"
        column={buildColumn()}
      />
    )

    await user.click(screen.getByRole("button", { name: /add new item/i }))
    await user.type(
      screen.getByPlaceholderText("Write a feedback item…"),
      "Great teamwork"
    )
    await user.keyboard("{Enter}")

    await waitFor(() =>
      expect(requestBody).toEqual({ content: "Great teamwork" })
    )
    expect(
      screen.queryByPlaceholderText("Write a feedback item…")
    ).not.toBeInTheDocument()
  })

  it("closes the form without submitting when Escape is pressed", async () => {
    let requestCount = 0
    server.use(
      http.post("*/api/retrospectives/retro-1/columns/column-1/items", () => {
        requestCount += 1
        return HttpResponse.json("item-2")
      })
    )

    const user = userEvent.setup()
    renderWithProviders(
      <RetrospectiveColumnCard
        retrospectiveId="retro-1"
        column={buildColumn()}
      />
    )

    await user.click(screen.getByRole("button", { name: /add new item/i }))
    await user.type(
      screen.getByPlaceholderText("Write a feedback item…"),
      "Great teamwork"
    )
    await user.keyboard("{Escape}")

    expect(
      screen.queryByPlaceholderText("Write a feedback item…")
    ).not.toBeInTheDocument()
    expect(requestCount).toBe(0)
  })
})
