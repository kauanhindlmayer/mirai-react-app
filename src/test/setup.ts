import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll } from "vitest"
import { cleanup } from "@testing-library/react"

import { server } from "@/test/mocks/server"

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function stubDOMRect(): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    toJSON: () => ({}),
  }
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
  window.ResizeObserver ??= ResizeObserverStub
  Element.prototype.scrollIntoView ??= () => {}
  Element.prototype.hasPointerCapture ??= () => false
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  // jsdom has no layout engine, so Range never implements these (needed by
  // Tiptap/ProseMirror's cursor-position calculations).
  Range.prototype.getClientRects ??= () => [] as unknown as DOMRectList
  Range.prototype.getBoundingClientRect ??= stubDOMRect
  // ProseMirror's mousedown handler calls this to resolve a click position;
  // jsdom has no layout engine to back a real implementation.
  document.elementFromPoint ??= () => null
  window.matchMedia ??= (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
