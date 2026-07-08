import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ProjectGitHubTab } from "@/components/projects/project-github-tab"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"

describe("ProjectGitHubTab", () => {
  describe("when not connected", () => {
    it("redirects to the GitHub App install URL when the connect button is clicked", async () => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: { href: "http://localhost:3000/" },
      })

      server.use(
        http.get(
          "*/api/organizations/org-1/projects/project-1/github/install-url",
          () =>
            HttpResponse.json({
              url: "https://github.com/apps/mirai/installations/new?state=abc",
            })
        )
      )

      const user = userEvent.setup()
      renderWithProviders(
        <ProjectGitHubTab organizationId="org-1" projectId="project-1" />
      )

      await user.click(
        screen.getByRole("button", { name: "Connect your GitHub Account" })
      )

      await waitFor(() =>
        expect(window.location.href).toBe(
          "https://github.com/apps/mirai/installations/new?state=abc"
        )
      )
    })
  })

  describe("when connected", () => {
    const connection = {
      repositoryId: 2002,
      repositoryOwner: "mirai-org",
      repositoryName: "mirai-app",
      connectedAtUtc: "2026-07-01T00:00:00Z",
    }

    it("shows the connected repository", () => {
      renderWithProviders(
        <ProjectGitHubTab
          organizationId="org-1"
          projectId="project-1"
          connection={connection}
        />
      )

      expect(
        screen.getByRole("link", { name: "mirai-org/mirai-app" })
      ).toHaveAttribute("href", "https://github.com/mirai-org/mirai-app")
    })

    it("does not disconnect when the confirmation is cancelled", async () => {
      let deleteRequestCount = 0
      server.use(
        http.delete(
          "*/api/organizations/org-1/projects/project-1/github/connection",
          () => {
            deleteRequestCount += 1
            return new HttpResponse(null, { status: 204 })
          }
        )
      )

      const user = userEvent.setup()
      renderWithProviders(
        <ProjectGitHubTab
          organizationId="org-1"
          projectId="project-1"
          connection={connection}
        />
      )

      await user.click(screen.getByRole("button", { name: "Disconnect" }))
      await user.click(screen.getByRole("button", { name: "Cancel" }))

      expect(deleteRequestCount).toBe(0)
    })

    it("disconnects the repository when confirmed", async () => {
      let deleteRequestCount = 0
      server.use(
        http.delete(
          "*/api/organizations/org-1/projects/project-1/github/connection",
          () => {
            deleteRequestCount += 1
            return new HttpResponse(null, { status: 204 })
          }
        )
      )

      const user = userEvent.setup()
      renderWithProviders(
        <ProjectGitHubTab
          organizationId="org-1"
          projectId="project-1"
          connection={connection}
        />
      )

      await user.click(screen.getByRole("button", { name: "Disconnect" }))
      const dialog = screen.getByRole("alertdialog")
      await user.click(
        within(dialog).getByRole("button", { name: "Disconnect" })
      )

      await waitFor(() => expect(deleteRequestCount).toBe(1))
    })
  })
})
