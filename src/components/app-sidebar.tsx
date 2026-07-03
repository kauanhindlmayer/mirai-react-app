"use client"

import * as React from "react"
import { useParams } from "react-router"
import { BookIcon, ClipboardPenIcon, Settings2Icon } from "lucide-react"

import { NavMain, type NavMainItem } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useCurrentUser } from "@/hooks/use-auth"

function useNavMainItems(): NavMainItem[] {
  const { organizationId, projectId } = useParams<{
    organizationId?: string
    projectId?: string
  }>()

  if (projectId) {
    return [
      {
        title: "Overview",
        icon: <BookIcon />,
        items: [
          { title: "Summary", url: `/projects/${projectId}/summary` },
          { title: "Dashboards", url: `/projects/${projectId}/dashboards` },
          { title: "Wiki Pages", url: `/projects/${projectId}/wiki-pages` },
        ],
      },
      {
        title: "Boards",
        icon: <ClipboardPenIcon />,
        items: [
          { title: "Work Items", url: `/projects/${projectId}/work-items` },
          { title: "Boards", url: `/projects/${projectId}/boards` },
          { title: "Backlogs", url: `/projects/${projectId}/backlogs` },
          { title: "Sprints", url: `/projects/${projectId}/sprints` },
          { title: "Personas", url: `/projects/${projectId}/personas` },
          {
            title: "Retrospectives",
            url: `/projects/${projectId}/retrospectives`,
          },
          { title: "Tags", url: `/projects/${projectId}/tags` },
        ],
      },
      {
        title: "Settings",
        icon: <Settings2Icon />,
        items: [
          { title: "Project Settings", url: `/projects/${projectId}/settings` },
        ],
      },
    ]
  }

  const projectsUrl = organizationId
    ? `/organizations/${organizationId}/projects`
    : "/organizations"
  const settingsUrl = organizationId
    ? `/organizations/${organizationId}/settings`
    : "/organizations"

  return [
    {
      title: "Overview",
      icon: <BookIcon />,
      items: [{ title: "Projects", url: projectsUrl }],
    },
    {
      title: "Settings",
      icon: <Settings2Icon />,
      items: [{ title: "Organization Settings", url: settingsUrl }],
    },
  ]
}

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const navMainItems = useNavMainItems()
  const { data: user } = useCurrentUser()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.fullName ?? "",
            email: user?.email ?? "",
            avatar: user?.imageUrl ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
