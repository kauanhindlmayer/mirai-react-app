"use client"

import * as React from "react"
import { useParams } from "react-router"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { ProjectSwitcher } from "@/components/layout/project-switcher"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useCurrentUserQuery } from "@/hooks/use-auth"
import { useNavMainItems } from "@/hooks/use-nav-main-items"
import { getAvatarUrl } from "@/lib/get-avatar-url"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { projectId } = useParams<{ projectId?: string }>()
  const navMainItems = useNavMainItems()
  const { data: user } = useCurrentUserQuery()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {projectId ? <ProjectSwitcher /> : <TeamSwitcher />}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.fullName ?? "",
            email: user?.email ?? "",
            avatar: getAvatarUrl(user?.imageUrl) ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
