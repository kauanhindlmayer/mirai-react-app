import { Navigate, Outlet, useLocation } from "react-router"

import { isAuthenticated } from "@/lib/auth-storage"

const PUBLIC_PATHS = ["/login", "/signup"]

export default function ProtectedLayout() {
  const location = useLocation()
  const authenticated = isAuthenticated()
  const isPublicRoute = PUBLIC_PATHS.includes(location.pathname)

  if (!authenticated && !isPublicRoute) {
    return <Navigate to="/login" replace />
  }

  if (authenticated && isPublicRoute) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
