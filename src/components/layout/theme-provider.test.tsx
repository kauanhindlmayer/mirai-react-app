import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, render, renderHook, screen } from "@testing-library/react"

import { ThemeProvider, useTheme } from "@/components/layout/theme-provider"

const STORAGE_KEY = "theme-provider-test"

function mockSystemTheme(prefersDark: boolean) {
  vi.spyOn(window, "matchMedia").mockReturnValue({
    matches: prefersDark,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as unknown as MediaQueryList)
}

function renderProvider(
  props: Partial<Parameters<typeof ThemeProvider>[0]> = {}
) {
  return renderHook(() => useTheme(), {
    wrapper: ({ children }) => (
      <ThemeProvider storageKey={STORAGE_KEY} {...props}>
        {children}
      </ThemeProvider>
    ),
  })
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove("light", "dark")
  mockSystemTheme(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("ThemeProvider / useTheme", () => {
  it("throws when useTheme is used outside a ThemeProvider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      "useTheme must be used within a ThemeProvider"
    )
  })

  it("defaults to system theme and resolves it against the OS preference", () => {
    mockSystemTheme(true)
    const { result } = renderProvider()

    expect(result.current.theme).toBe("system")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("reads a previously persisted theme from storage on mount", () => {
    localStorage.setItem(STORAGE_KEY, "dark")

    const { result } = renderProvider()

    expect(result.current.theme).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("falls back to the default theme when storage holds an invalid value", () => {
    localStorage.setItem(STORAGE_KEY, "solarized")

    const { result } = renderProvider({ defaultTheme: "light" })

    expect(result.current.theme).toBe("light")
  })

  it("persists and applies a theme change via setTheme", () => {
    const { result } = renderProvider()

    act(() => {
      result.current.setTheme("dark")
    })

    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.classList.contains("light")).toBe(false)
  })

  it("cycles the theme with the 'd' keyboard shortcut", () => {
    render(
      <ThemeProvider storageKey={STORAGE_KEY} defaultTheme="light">
        <p>App content</p>
      </ThemeProvider>
    )
    expect(screen.getByText("App content")).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))
    })
    expect(document.documentElement.classList.contains("dark")).toBe(true)

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "d" }))
    })
    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("ignores the 'd' shortcut when a modifier key is held", () => {
    render(
      <ThemeProvider storageKey={STORAGE_KEY} defaultTheme="light">
        <p>App content</p>
      </ThemeProvider>
    )

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "d", metaKey: true })
      )
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("ignores the 'd' shortcut while typing into an editable field", () => {
    render(
      <ThemeProvider storageKey={STORAGE_KEY} defaultTheme="light">
        <input aria-label="Title" />
      </ThemeProvider>
    )

    const input = screen.getByLabelText("Title")
    input.focus()
    act(() => {
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "d", bubbles: true })
      )
    })

    expect(document.documentElement.classList.contains("light")).toBe(true)
  })

  it("syncs the theme when another tab changes the stored value", () => {
    const { result } = renderProvider({ defaultTheme: "light" })
    expect(result.current.theme).toBe("light")

    localStorage.setItem(STORAGE_KEY, "dark")
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: "dark",
          storageArea: localStorage,
        })
      )
    })

    expect(result.current.theme).toBe("dark")
  })
})
