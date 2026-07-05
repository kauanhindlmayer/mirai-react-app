import { describe, expect, it, vi } from "vitest"

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }))

import { toast } from "sonner"

import { createErrorToastHandler } from "@/lib/query-helpers"

describe("createErrorToastHandler", () => {
  it("shows the error's message when given an Error instance", () => {
    const handleError = createErrorToastHandler("Failed to save.")

    handleError(new Error("Network unreachable"))

    expect(toast.error).toHaveBeenCalledWith("Failed to save.", {
      description: "Network unreachable",
    })
  })

  it("shows a generic description for a non-Error value", () => {
    const handleError = createErrorToastHandler("Failed to save.")

    handleError("some string")

    expect(toast.error).toHaveBeenCalledWith("Failed to save.", {
      description: "Something went wrong.",
    })
  })
})
