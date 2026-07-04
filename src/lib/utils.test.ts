import { describe, expect, it } from "vitest"

import { getErrorMessage, getInitials } from "@/lib/utils"

describe("getErrorMessage", () => {
  it("returns the message of an Error instance", () => {
    expect(getErrorMessage(new Error("Something specific failed"))).toBe(
      "Something specific failed"
    )
  })

  it("falls back to a generic message for non-Error values", () => {
    expect(getErrorMessage("a plain string")).toBe("Something went wrong.")
    expect(getErrorMessage(undefined)).toBe("Something went wrong.")
    expect(getErrorMessage({ message: "not an Error" })).toBe(
      "Something went wrong."
    )
  })
})

describe("getInitials", () => {
  it("returns an empty string when no name is given", () => {
    expect(getInitials(undefined)).toBe("")
    expect(getInitials("")).toBe("")
  })

  it("returns a single initial for a one-word name", () => {
    expect(getInitials("Madonna")).toBe("M")
  })

  it("returns first + last initials for a multi-word name", () => {
    expect(getInitials("John Doe")).toBe("JD")
  })

  it("uses the first and last parts when there are more than two words", () => {
    expect(getInitials("John Middle Doe")).toBe("JD")
  })

  it("collapses repeated whitespace between name parts", () => {
    expect(getInitials("John   Doe")).toBe("JD")
  })
})
