import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { DeleteWikiPageDialog } from "@/components/wiki-pages/delete-wiki-page-dialog"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

describe("DeleteWikiPageDialog", () => {
  it("shows a confirmation with the page title when opened", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <DeleteWikiPageDialog
        projectId="project-1"
        wikiPageId="page-1"
        title="Onboarding"
        onDeleted={vi.fn()}
      />
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))

    expect(screen.getByText('Delete "Onboarding"?')).toBeInTheDocument()
  })

  it("does not delete the page when cancelled", async () => {
    let deleteRequestCount = 0
    server.use(
      http.delete("*/api/projects/project-1/wiki-pages/page-1", () => {
        deleteRequestCount += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    const onDeleted = vi.fn()
    renderWithProviders(
      <DeleteWikiPageDialog
        projectId="project-1"
        wikiPageId="page-1"
        title="Onboarding"
        onDeleted={onDeleted}
      />
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    await user.click(screen.getByRole("button", { name: "Cancel" }))

    expect(deleteRequestCount).toBe(0)
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it("deletes the page and calls onDeleted when confirmed", async () => {
    let deleteRequestCount = 0
    server.use(
      http.delete("*/api/projects/project-1/wiki-pages/page-1", () => {
        deleteRequestCount += 1
        return new HttpResponse(null, { status: 204 })
      })
    )

    const user = userEvent.setup()
    const onDeleted = vi.fn()
    renderWithProviders(
      <DeleteWikiPageDialog
        projectId="project-1"
        wikiPageId="page-1"
        title="Onboarding"
        onDeleted={onDeleted}
      />
    )

    await user.click(screen.getByRole("button", { name: "Delete" }))
    const dialog = screen.getByRole("alertdialog")
    await user.click(within(dialog).getByRole("button", { name: "Delete" }))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
    expect(onDeleted).toHaveBeenCalledTimes(1)
  })
})
