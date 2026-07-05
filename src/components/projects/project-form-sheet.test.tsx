import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ProjectFormSheet } from "@/components/projects/project-form-sheet"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { Project } from "@/types/projects"

function buildProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "project-1",
    name: "Mirai",
    description: "Project management tool",
    organizationId: "org-1",
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("ProjectFormSheet", () => {
  it("shows the create-project heading with an empty form", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ProjectFormSheet
        organizationId="org-1"
        trigger={<button>New Project</button>}
      />
    )

    await user.click(screen.getByRole("button", { name: "New Project" }))

    expect(screen.getByText("Create project")).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("")
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument()
  })

  it("creates a project with the entered values", async () => {
    let requestBody: unknown
    server.use(
      http.post("*/api/organizations/org-1/projects", async ({ request }) => {
        requestBody = await request.json()
        return HttpResponse.json("project-1")
      })
    )

    const user = userEvent.setup()
    renderWithProviders(
      <ProjectFormSheet
        organizationId="org-1"
        trigger={<button>New Project</button>}
      />
    )

    await user.click(screen.getByRole("button", { name: "New Project" }))
    await user.type(screen.getByLabelText("Name"), "Mirai")
    await user.click(screen.getByRole("button", { name: "Create" }))

    await waitFor(() =>
      expect(requestBody).toEqual({
        organizationId: "org-1",
        name: "Mirai",
        description: "",
      })
    )
    expect(screen.queryByText("Create project")).not.toBeInTheDocument()
  })

  it("shows the edit-project heading pre-filled when a project is passed", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ProjectFormSheet
        organizationId="org-1"
        project={buildProject()}
        trigger={<button>Edit</button>}
      />
    )

    await user.click(screen.getByRole("button", { name: "Edit" }))

    expect(screen.getByText("Edit project")).toBeInTheDocument()
    expect(screen.getByLabelText("Name")).toHaveValue("Mirai")
    expect(
      screen.getByRole("button", { name: "Save changes" })
    ).toBeInTheDocument()
  })

  it("updates the project with the edited values", async () => {
    let requestBody: unknown
    server.use(
      http.put(
        "*/api/organizations/org-1/projects/project-1",
        async ({ request }) => {
          requestBody = await request.json()
          return HttpResponse.json("project-1")
        }
      )
    )

    const user = userEvent.setup()
    renderWithProviders(
      <ProjectFormSheet
        organizationId="org-1"
        project={buildProject()}
        trigger={<button>Edit</button>}
      />
    )

    await user.click(screen.getByRole("button", { name: "Edit" }))
    const nameInput = screen.getByLabelText("Name")
    await user.clear(nameInput)
    await user.type(nameInput, "Mirai Renamed")
    await user.click(screen.getByRole("button", { name: "Save changes" }))

    await waitFor(() =>
      expect(requestBody).toMatchObject({ name: "Mirai Renamed" })
    )
  })
})
