import { describe, expect, it } from "vitest"
import { screen, waitFor } from "@testing-library/react"

import { WikiPageEditor } from "@/components/wiki-pages/wiki-page-editor"
import { renderWithProviders } from "@/test/test-utils"

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
})
