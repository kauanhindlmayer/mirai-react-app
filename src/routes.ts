import { type RouteConfig, route, index, layout } from "@react-router/dev/routes"

export default [
  layout("./components/protected-layout.tsx", [
    route("login", "./pages/LoginPage.tsx"),
    route("signup", "./pages/SignupPage.tsx"),

    layout("./components/root-layout.tsx", [
      index("./pages/HomeRedirectPage.tsx", { id: "home" }),

      route("organizations", "./pages/OrganizationsPage.tsx"),
      route(
        "organizations/:organizationId/projects",
        "./pages/OrganizationProjectsPage.tsx"
      ),
      route(
        "organizations/:organizationId/settings",
        "./pages/OrganizationSettingsPage.tsx"
      ),

      route("projects/:projectId/summary", "./pages/ProjectSummaryPage.tsx"),
      route(
        "projects/:projectId/dashboards",
        "./pages/ProjectDashboardsPage.tsx"
      ),
      route("projects/:projectId/wiki-pages", "./pages/WikiPagesPage.tsx"),
      route(
        "projects/:projectId/wiki-pages/new",
        "./pages/WikiPageNewPage.tsx"
      ),
      route(
        "projects/:projectId/wiki-pages/:wikiPageId",
        "./pages/WikiPageViewPage.tsx"
      ),
      route(
        "projects/:projectId/wiki-pages/:wikiPageId/edit",
        "./pages/WikiPageEditPage.tsx"
      ),
      route("projects/:projectId/work-items", "./pages/WorkItemsPage.tsx"),
      route("projects/:projectId/boards", "./pages/BoardsPage.tsx"),
      route("projects/:projectId/backlogs", "./pages/BacklogsPage.tsx"),
      route("projects/:projectId/sprints", "./pages/SprintsPage.tsx"),
      route("projects/:projectId/personas", "./pages/PersonasPage.tsx"),
      route(
        "projects/:projectId/retrospectives/:retrospectiveId?",
        "./pages/RetrospectivesPage.tsx"
      ),
      route("projects/:projectId/tags", "./pages/TagsPage.tsx"),
      route("projects/:projectId/tags/import", "./pages/TagsImportPage.tsx"),
      route(
        "projects/:projectId/wisdom-extractor",
        "./pages/WisdomExtractorPage.tsx"
      ),
      route("projects/:projectId/settings", "./pages/ProjectSettingsPage.tsx"),
    ]),

    route("not-found", "./pages/NotFoundPage.tsx"),
    route("oops", "./pages/OopsPage.tsx"),
    route("*", "./pages/NotFoundPage.tsx", { id: "catch-all" }),
  ]),
] satisfies RouteConfig
