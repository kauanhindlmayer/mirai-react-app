import "@testing-library/jest-dom/vitest"
import { afterAll, afterEach, beforeAll } from "vitest"
import { cleanup } from "@testing-library/react"

import { server } from "@/test/mocks/server"

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" })
  window.ResizeObserver ??= ResizeObserverStub
  Element.prototype.scrollIntoView ??= () => {}
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})
