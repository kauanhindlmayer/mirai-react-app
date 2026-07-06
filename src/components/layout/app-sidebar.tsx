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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useCurrentUserQuery } from "@/hooks/use-auth"
import { useNavMainItems } from "@/hooks/use-nav-main-items"
import { getAvatarUrl } from "@/lib/get-avatar-url"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { projectId } = useParams<{ projectId?: string }>()
  const { sections, settingsItems } = useNavMainItems()
  const { data: user } = useCurrentUserQuery()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {projectId ? <ProjectSwitcher /> : <TeamSwitcher />}
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <NavMain
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavMain items={settingsItems} />
        <SidebarSeparator className="mx-0" />
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
