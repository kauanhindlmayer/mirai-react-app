import {
  type RouteConfig,
  route,
  index,
  layout,
} from "@react-router/dev/routes"

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

      route("projects/:projectId", "./components/project-layout.tsx", [
        route("summary", "./pages/ProjectSummaryPage.tsx"),
        route("dashboards", "./pages/ProjectDashboardsPage.tsx"),
        route("wiki-pages", "./components/wiki-pages/wiki-pages-layout.tsx", [
          index("./pages/WikiPagesPage.tsx", { id: "wiki-pages-index" }),
          route("new", "./pages/WikiPageNewPage.tsx"),
          route(":wikiPageId", "./pages/WikiPageViewPage.tsx"),
          route(":wikiPageId/edit", "./pages/WikiPageEditPage.tsx"),
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
        route("tags", "./pages/TagsPage.tsx"),
        route("tags/import", "./pages/TagsImportPage.tsx"),
        route("wisdom-extractor", "./pages/WisdomExtractorPage.tsx"),
        route("settings", "./pages/ProjectSettingsPage.tsx"),
      ]),
    ]),

    route("not-found", "./pages/NotFoundPage.tsx"),
    route("oops", "./pages/OopsPage.tsx"),
    route("*", "./pages/NotFoundPage.tsx", { id: "catch-all" }),
  ]),
] satisfies RouteConfig
