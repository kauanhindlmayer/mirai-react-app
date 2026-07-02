import { type RouteConfig, route, index } from "@react-router/dev/routes"

export default [
  index("./pages/DashboardPage.tsx", { id: "home" }),
  route("dashboard", "./pages/DashboardPage.tsx"),
  route("login", "./pages/LoginPage.tsx"),
  route("signup", "./pages/SignupPage.tsx"),
] satisfies RouteConfig
