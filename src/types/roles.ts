export const RoleScope = {
  Organization: "Organization",
  Project: "Project",
  Team: "Team",
} as const

export type RoleScope = (typeof RoleScope)[keyof typeof RoleScope]

export const Permission = {
  OrganizationView: "OrganizationView",
  OrganizationManage: "OrganizationManage",
  OrganizationManageMembers: "OrganizationManageMembers",
  OrganizationDelete: "OrganizationDelete",
  ProjectView: "ProjectView",
  ProjectManage: "ProjectManage",
  ProjectManageMembers: "ProjectManageMembers",
  ProjectDelete: "ProjectDelete",
  ProjectManageWorkItems: "ProjectManageWorkItems",
  ProjectManageBoards: "ProjectManageBoards",
  ProjectManageSprints: "ProjectManageSprints",
  ProjectManageWikiPages: "ProjectManageWikiPages",
  ProjectManageTags: "ProjectManageTags",
  ProjectManageRetrospectives: "ProjectManageRetrospectives",
  ProjectManagePersonas: "ProjectManagePersonas",
  ProjectViewDashboards: "ProjectViewDashboards",
  TeamView: "TeamView",
  TeamManage: "TeamManage",
  TeamManageMembers: "TeamManageMembers",
  TeamManageSprints: "TeamManageSprints",
  TeamManageBoards: "TeamManageBoards",
  TeamManageRetrospectives: "TeamManageRetrospectives",
} as const

export type Permission = (typeof Permission)[keyof typeof Permission]

export type Role = {
  id: string
  name: string
  scope: RoleScope
}
