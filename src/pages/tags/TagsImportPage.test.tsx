import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes } from "react-router"

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock("@/queries/tag-import-jobs", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/queries/tag-import-jobs")>()
  return { ...actual, useCreateTagImportJobMutation: vi.fn() }
})

import { http, HttpResponse } from "msw"
import { toast } from "sonner"
import { useCreateTagImportJobMutation } from "@/queries/tag-import-jobs"
import TagsImportPage from "@/pages/tags/TagsImportPage"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { TagImportJob } from "@/types/tag-import-jobs"

function buildJob(overrides: Partial<TagImportJob> = {}): TagImportJob {
  return {
    id: "job-1",
    status: "Completed",
    fileName: "tags.csv",
    totalRecords: 10,
    processedRecords: 10,
    successfulRecords: 9,
    failedRecords: 1,
    errors: [],
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

function mockJobs(items: TagImportJob[]) {
  server.use(
    http.get("*/api/projects/project-1/tags/import", () =>
      HttpResponse.json({
        items,
        totalCount: items.length,
        pageSize: 10,
        page: 1,
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        _links: [],
      })
    )
  )
}

function renderImportPage() {
  return renderWithProviders(
    <Routes>
      <Route
        path="/projects/:projectId/tags/import"
        element={<TagsImportPage />}
      />
    </Routes>,
    { route: "/projects/project-1/tags/import" }
  )
}

const uploadMutate = vi.fn()

beforeEach(() => {
  uploadMutate.mockClear()
  vi.mocked(useCreateTagImportJobMutation).mockReturnValue({
    mutate: uploadMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useCreateTagImportJobMutation>)
  vi.mocked(toast.error).mockClear()
})

describe("TagsImportPage", () => {
  it("lists import jobs with their status and counts", async () => {
    mockJobs([buildJob()])
    renderImportPage()

    expect(await screen.findByText("tags.csv")).toBeInTheDocument()
    expect(screen.getByText("Completed")).toBeInTheDocument()
    expect(screen.getByText("10/10")).toBeInTheDocument()
  })

  it("shows an empty state when there are no import jobs", async () => {
    mockJobs([])
    renderImportPage()

    expect(await screen.findByText("No import jobs yet.")).toBeInTheDocument()
  })

  it("uploads the selected CSV file", async () => {
    mockJobs([])
    const user = userEvent.setup()
    const { container } = renderImportPage()

    const file = new File(["name,color"], "tags.csv", { type: "text/csv" })
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, file)

    expect(uploadMutate).toHaveBeenCalledWith(file)
  })

  it("rejects a file larger than 10MB without uploading", async () => {
    mockJobs([])
    const user = userEvent.setup()
    const { container } = renderImportPage()

    const oversizedFile = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      "tags.csv",
      { type: "text/csv" }
    )
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement
    await user.upload(fileInput, oversizedFile)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "File too large.",
        expect.objectContaining({
          description: "CSV files must be 10MB or smaller.",
        })
      )
    )
    expect(uploadMutate).not.toHaveBeenCalled()
  })
})
