import {
  type RouteConfig,
  route,
  index,
  layout,
} from "@react-router/dev/routes"

export default [
  route("login", "./pages/auth/LoginPage.tsx"),
  route("signup", "./pages/auth/SignupPage.tsx"),
  route("auth/github/callback", "./pages/auth/GitHubCallbackPage.tsx"),

  layout("./components/layout/root-layout.tsx", [
    index("./pages/HomeRedirectPage.tsx", { id: "home" }),

    route("organizations", "./pages/organizations/OrganizationsPage.tsx"),
    route(
      "organizations/:organizationId/projects",
      "./pages/organizations/OrganizationProjectsPage.tsx"
    ),
    route(
      "organizations/:organizationId/settings",
      "./pages/organizations/OrganizationSettingsPage.tsx"
    ),

    route("projects/:projectId", "./components/layout/project-layout.tsx", [
      route("summary", "./pages/projects/ProjectSummaryPage.tsx"),
      route("dashboards", "./pages/projects/ProjectDashboardsPage.tsx"),
      route("wiki-pages", "./components/wiki-pages/wiki-pages-layout.tsx", [
        index("./pages/wiki-pages/WikiPagesPage.tsx", {
          id: "wiki-pages-index",
        }),
        route("new", "./pages/wiki-pages/WikiPageNewPage.tsx"),
        route(":wikiPageId", "./pages/wiki-pages/WikiPageViewPage.tsx"),
        route(":wikiPageId/edit", "./pages/wiki-pages/WikiPageEditPage.tsx"),
      ]),
      route("work-items", "./pages/WorkItemsPage.tsx"),
      route("boards", "./pages/BoardsPage.tsx"),
      route("backlogs", "./pages/BacklogsPage.tsx"),
      route("sprints", "./pages/SprintsPage.tsx"),
      route("personas", "./pages/PersonasPage.tsx"),
      route(
        "retrospectives/:retrospectiveId?",
        "./pages/RetrospectivesPage.tsx"
      ),
      route("tags", "./pages/tags/TagsPage.tsx"),
      route("tags/import", "./pages/tags/TagsImportPage.tsx"),
      route("wisdom-extractor", "./pages/WisdomExtractorPage.tsx"),
      route("settings", "./pages/projects/ProjectSettingsPage.tsx"),
    ]),
  ]),

  route("not-found", "./pages/NotFoundPage.tsx"),
  route("oops", "./pages/OopsPage.tsx"),
  route("*", "./pages/NotFoundPage.tsx", { id: "catch-all" }),
] satisfies RouteConfig
