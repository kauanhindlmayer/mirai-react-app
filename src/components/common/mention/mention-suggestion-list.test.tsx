import { createRef } from "react"
import { describe, expect, it } from "vitest"

import {
  MentionSuggestionList,
  type MentionSuggestionListHandle,
} from "@/components/common/mention/mention-suggestion-list"
import type { MentionSuggestionItem } from "@/components/common/mention/mention-suggestion-item"
import { render, screen } from "@/test/test-utils"

function buildItems(count: number): MentionSuggestionItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `user-${index}`,
    fullName: `Person ${index}`,
  }))
}

describe("MentionSuggestionList", () => {
  it("caps its own height and scrolls instead of growing unbounded", () => {
    render(
      <MentionSuggestionList items={buildItems(20)} command={() => {}} />
    )

    const list = screen.getByText("Person 0").closest("div.flex")
    expect(list).toHaveClass("max-h-64", "overflow-y-auto")
  })

  it("renders every matching person as a selectable option", () => {
    render(
      <MentionSuggestionList items={buildItems(3)} command={() => {}} />
    )

    expect(screen.getByRole("button", { name: /Person 0/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Person 1/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Person 2/ })).toBeInTheDocument()
  })

  it("shows a fallback message when there are no matches", () => {
    render(<MentionSuggestionList items={[]} command={() => {}} />)

    expect(screen.getByText("No matches found.")).toBeInTheDocument()
  })

  it("selects a person via the imperative handle on Enter", () => {
    const ref = createRef<MentionSuggestionListHandle>()
    const items = buildItems(2)
    let selected: { id: string; label: string } | undefined
    render(
      <MentionSuggestionList
        ref={ref}
        items={items}
        command={(attrs) => (selected = attrs)}
      />
    )

    ref.current?.onKeyDown({
      event: new KeyboardEvent("keydown", { key: "Enter" }),
    })

    expect(selected).toEqual({ id: "user-0", label: "Person 0" })
  })
})
