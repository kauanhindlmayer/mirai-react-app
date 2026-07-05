import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { BoardSettingsSheet } from "@/components/boards/board-settings-sheet"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { Column } from "@/types/boards"

function buildColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: "column-1",
    name: "To Do",
    position: 1,
    isDefault: false,
    cards: [],
    hasMoreCards: false,
    totalCardCount: 0,
    ...overrides,
  }
}

describe("BoardSettingsSheet", () => {
  it("opens the sheet listing the board's columns", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BoardSettingsSheet
        boardId="board-1"
        columns={[buildColumn({ name: "Doing" })]}
      />
    )

    await user.click(screen.getByRole("button", { name: /board settings/i }))

    expect(screen.getByText("Doing")).toBeInTheDocument()
  })

  it("marks the default column and hides its delete button", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BoardSettingsSheet
        boardId="board-1"
        columns={[buildColumn({ name: "Done", isDefault: true })]}
      />
    )

    await user.click(screen.getByRole("button", { name: /board settings/i }))

    expect(screen.getByText("(default)")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Delete column" })
    ).not.toBeInTheDocument()
  })

  it("hides the delete button for a non-empty, non-default column", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BoardSettingsSheet
        boardId="board-1"
        columns={[buildColumn({ totalCardCount: 3 })]}
      />
    )

    await user.click(screen.getByRole("button", { name: /board settings/i }))

    expect(
      screen.queryByRole("button", { name: "Delete column" })
    ).not.toBeInTheDocument()
  })

  it("deletes an empty, non-default column", async () => {
    let deleteRequestCount = 0
    server.use(
      http.delete("*/api/boards/board-1/columns/column-1", () => {
        deleteRequestCount += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    renderWithProviders(
      <BoardSettingsSheet boardId="board-1" columns={[buildColumn()]} />
    )

    await user.click(screen.getByRole("button", { name: /board settings/i }))
    await user.click(screen.getByRole("button", { name: "Delete column" }))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })

  it("adds a new column with the entered values", async () => {
    let requestBody: unknown
    server.use(
      http.post("*/api/boards/board-1/columns", async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json("column-2")
      })
    )

    const user = userEvent.setup()
    renderWithProviders(<BoardSettingsSheet boardId="board-1" columns={[]} />)

    await user.click(screen.getByRole("button", { name: /board settings/i }))
    await user.type(screen.getByLabelText("Name"), "In Review")
    await user.type(screen.getByLabelText("WIP limit"), "5")
    await user.click(screen.getByRole("button", { name: "Add column" }))

    await waitFor(() =>
      expect(requestBody).toEqual({
        name: "In Review",
        position: 1,
        wipLimit: 5,
        definitionOfDone: undefined,
      })
    )
  })
})
