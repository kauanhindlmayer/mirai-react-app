import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("@/queries/work-items", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/queries/work-items")>()
  return { ...actual, useUploadWorkItemAttachmentMutation: vi.fn() }
})

import { useUploadWorkItemAttachmentMutation } from "@/queries/work-items"
import { WorkItemAttachments } from "@/components/work-items/work-item-attachments"
import { WorkItemProvider } from "@/components/work-items/work-item-context"
import { server } from "@/test/mocks/server"
import { renderWithProviders } from "@/test/test-utils"
import type { WorkItemAttachment } from "@/types/work-items"

function renderAttachments(attachments: WorkItemAttachment[]) {
  return renderWithProviders(
    <WorkItemProvider projectId="project-1" workItemId="work-item-1">
      <WorkItemAttachments attachments={attachments} />
    </WorkItemProvider>
  )
}

function buildAttachment(
  overrides: Partial<WorkItemAttachment> = {}
): WorkItemAttachment {
  return {
    id: "attachment-1",
    fileName: "spec.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 2048,
    authorId: "user-1",
    createdAtUtc: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

const uploadMutate = vi.fn()

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock-url")
  URL.revokeObjectURL = vi.fn()
  uploadMutate.mockClear()
  vi.mocked(useUploadWorkItemAttachmentMutation).mockReturnValue({
    mutate: uploadMutate,
    isPending: false,
  } as unknown as ReturnType<typeof useUploadWorkItemAttachmentMutation>)
})

describe("WorkItemAttachments", () => {
  it("renders a placeholder when there are no attachments", () => {
    renderAttachments([])

    expect(screen.getByText("No attachments yet.")).toBeInTheDocument()
  })

  it("renders existing attachments with a formatted file size", () => {
    renderAttachments([buildAttachment({ fileSizeBytes: 1536 })])

    expect(screen.getByText("spec.pdf")).toBeInTheDocument()
    expect(screen.getByText("1.5 KB")).toBeInTheDocument()
  })

  it("uploads the selected file", async () => {
    // MSW can't intercept FormData request bodies under jsdom (a bare
    // fetch + FormData hangs identically, independent of this component),
    // so the upload mutation itself is mocked and we assert the component
    // passes the selected File through to it.
    const user = userEvent.setup()
    const { container } = renderAttachments([])
    const file = new File(["contents"], "notes.txt", { type: "text/plain" })
    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement

    await user.upload(fileInput, file)

    expect(uploadMutate).toHaveBeenCalledTimes(1)
    expect(uploadMutate).toHaveBeenCalledWith(file)
  })

  it("deletes an attachment when its delete button is clicked", async () => {
    let deleteRequestCount = 0
    server.use(
      http.delete(
        "*/api/projects/project-1/work-items/work-item-1/attachments/attachment-1",
        () => {
          deleteRequestCount += 1
          return new HttpResponse(null, { status: 204 })
        }
      )
    )

    const user = userEvent.setup()
    renderAttachments([buildAttachment()])

    await user.click(screen.getByRole("button", { name: "Delete spec.pdf" }))

    await waitFor(() => expect(deleteRequestCount).toBe(1))
  })

  it("downloads an attachment when its download button is clicked", async () => {
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {})
    server.use(
      http.get(
        "*/api/projects/project-1/work-items/work-item-1/attachments/attachment-1",
        () => HttpResponse.arrayBuffer(new ArrayBuffer(4))
      )
    )

    const user = userEvent.setup()
    renderAttachments([buildAttachment()])

    await user.click(screen.getByRole("button", { name: "Download spec.pdf" }))

    await waitFor(() => expect(clickSpy).toHaveBeenCalled())
    expect(URL.createObjectURL).toHaveBeenCalled()
    clickSpy.mockRestore()
  })
})
