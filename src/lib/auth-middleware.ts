import { redirect } from "react-router"
import type { MiddlewareFunction } from "react-router"

import { isAuthenticated } from "@/lib/auth-storage"

export const requireAuth: MiddlewareFunction = () => {
  if (!isAuthenticated()) {
    throw redirect("/login")
  }
}

export const redirectIfAuthenticated: MiddlewareFunction = () => {
  if (isAuthenticated()) {
    throw redirect("/")
  }
}
