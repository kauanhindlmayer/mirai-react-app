import { http, HttpResponse } from "msw"

import { server } from "@/test/mocks/server"

type MockProjectUser = {
  id: string
  fullName: string
  email: string
}

const DEFAULT_ORGANIZATION_ID = "org-1"
const DEFAULT_PROJECT_ID = "project-1"
const DEFAULT_USERS: MockProjectUser[] = [
  { id: "user-2", fullName: "Jane Smith", email: "jane.smith@mirai.com" },
]

export function mockProjectUsers(
  users: MockProjectUser[] = DEFAULT_USERS,
  organizationId = DEFAULT_ORGANIZATION_ID,
  projectId = DEFAULT_PROJECT_ID
) {
  server.use(
    http.get(
      `*/api/organizations/${organizationId}/projects/${projectId}/users`,
      () =>
        HttpResponse.json({
          items: users,
          totalCount: users.length,
          pageSize: 10,
          page: 1,
          hasNextPage: false,
          hasPreviousPage: false,
          totalPages: 1,
        })
    )
  )
}
