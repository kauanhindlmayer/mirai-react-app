import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useDraftField } from "@/hooks/use-draft-field"

describe("useDraftField", () => {
  it("initializes the draft to the given value", () => {
    const { result } = renderHook(() => useDraftField<string>("hello", vi.fn()))

    expect(result.current.draft).toBe("hello")
  })

  it("setDraft updates the local draft without committing", () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDraftField<string>("hello", onCommit))

    act(() => {
      result.current.setDraft("hello world")
    })

    expect(result.current.draft).toBe("hello world")
    expect(onCommit).not.toHaveBeenCalled()
  })

  it("commit calls onCommit with the draft when it differs from value", () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDraftField<string>("hello", onCommit))

    act(() => {
      result.current.setDraft("hello world")
    })
    act(() => {
      result.current.commit()
    })

    expect(onCommit).toHaveBeenCalledTimes(1)
    expect(onCommit).toHaveBeenCalledWith("hello world")
  })

  it("commit does not call onCommit when the draft is unchanged", () => {
    const onCommit = vi.fn()
    const { result } = renderHook(() => useDraftField<string>("hello", onCommit))

    act(() => {
      result.current.commit()
    })

    expect(onCommit).not.toHaveBeenCalled()
  })

  it("reset restores the draft to the current value prop", () => {
    let value = "hello"
    const { result, rerender } = renderHook(() => useDraftField(value, vi.fn()))

    act(() => {
      result.current.setDraft("edited")
    })
    expect(result.current.draft).toBe("edited")

    value = "hello from the server"
    rerender()
    act(() => {
      result.current.reset()
    })

    expect(result.current.draft).toBe("hello from the server")
  })

  it("does not resync the draft when value changes externally without reset", () => {
    let value = "hello"
    const { result, rerender } = renderHook(() => useDraftField(value, vi.fn()))

    act(() => {
      result.current.setDraft("edited")
    })

    value = "changed elsewhere"
    rerender()

    expect(result.current.draft).toBe("edited")
  })
})
