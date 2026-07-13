import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/hooks/use-current-project", () => ({
  useCurrentProject: () => ({
    projectId: "project-1",
    project: { id: "project-1", organizationId: "org-1" },
  }),
}))

import { WikiPageEditor } from "@/components/wiki-pages/wiki-page-editor"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

function mockProjectUsers() {
  server.use(
    http.get(
      "*/api/organizations/org-1/projects/project-1/users/mentionable",
      () =>
        HttpResponse.json({
          items: [{ id: "user-2", fullName: "Jane Smith" }],
          totalCount: 1,
          pageSize: 10,
          page: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        })
    )
  )
}

describe("WikiPageEditor", () => {
  it("renders the formatting toolbar when editable", async () => {
    renderWithProviders(<WikiPageEditor content="<p>Hello</p>" />)

    expect(
      await screen.findByRole("button", { name: "Bold" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Heading 1" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Heading 2" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Bullet list" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Numbered list" })
    ).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Quote" })).toBeInTheDocument()
  })

  it("hides the toolbar in read-only mode", async () => {
    renderWithProviders(
      <WikiPageEditor content="<p>Hello</p>" editable={false} />
    )

    await waitFor(() => expect(screen.getByText("Hello")).toBeInTheDocument())
    expect(
      screen.queryByRole("button", { name: "Bold" })
    ).not.toBeInTheDocument()
  })

  it("renders the provided content", async () => {
    renderWithProviders(<WikiPageEditor content="<p>Getting started</p>" />)

    expect(await screen.findByText("Getting started")).toBeInTheDocument()
  })

  it("mentions a project member and reports the resulting HTML via onChange", async () => {
    mockProjectUsers()
    const user = userEvent.setup()
    const handleChange = vi.fn()
    renderWithProviders(
      <WikiPageEditor content="<p></p>" onChange={handleChange} />
    )

    const editor = await screen.findByRole("textbox", {
      name: "Wiki page content",
    })
    await user.click(editor)
    await user.type(editor, "@jane")

    expect(await screen.findByText("Jane Smith")).toBeInTheDocument()

    await user.keyboard("{Enter}")

    await waitFor(() =>
      expect(
        editor.querySelector("[data-mention-user-id='user-2']")
      ).toBeInTheDocument()
    )
    await waitFor(() =>
      expect(handleChange).toHaveBeenLastCalledWith(
        expect.stringContaining('data-id="user-2"')
      )
    )
  })
})
