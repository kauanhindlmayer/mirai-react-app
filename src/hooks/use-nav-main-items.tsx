import { useParams } from "react-router"
import {
  BookOpenIcon,
  FileTextIcon,
  FolderIcon,
  KanbanIcon,
  LayoutDashboardIcon,
  ListIcon,
  ListTodoIcon,
  RotateCcwIcon,
  Settings2Icon,
  TagIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react"

import type { NavMainItem } from "@/components/layout/nav-main"

export type NavMainSection = {
  title: string
  items: NavMainItem[]
}

export type NavMainItems = {
  sections: NavMainSection[]
  settingsItems: NavMainItem[]
}

export function useNavMainItems(): NavMainItems {
  const { organizationId, projectId } = useParams<{
    organizationId?: string
    projectId?: string
  }>()

  if (projectId) {
    return {
      sections: [
        {
          title: "Overview",
          items: [
            {
              title: "Summary",
              url: `/projects/${projectId}/summary`,
              icon: <FileTextIcon />,
            },
            {
              title: "Dashboards",
              url: `/projects/${projectId}/dashboards`,
              icon: <LayoutDashboardIcon />,
            },
            {
              title: "Wiki Pages",
              url: `/projects/${projectId}/wiki-pages`,
              icon: <BookOpenIcon />,
            },
          ],
        },
        {
          title: "Boards",
          items: [
            {
              title: "Work Items",
              url: `/projects/${projectId}/work-items`,
              icon: <ListTodoIcon />,
            },
            {
              title: "Boards",
              url: `/projects/${projectId}/boards`,
              icon: <KanbanIcon />,
            },
            {
              title: "Backlogs",
              url: `/projects/${projectId}/backlogs`,
              icon: <ListIcon />,
            },
            {
              title: "Sprints",
              url: `/projects/${projectId}/sprints`,
              icon: <ZapIcon />,
            },
            {
              title: "Personas",
              url: `/projects/${projectId}/personas`,
              icon: <UsersIcon />,
            },
            {
              title: "Retrospectives",
              url: `/projects/${projectId}/retrospectives`,
              icon: <RotateCcwIcon />,
            },
            {
              title: "Tags",
              url: `/projects/${projectId}/tags`,
              icon: <TagIcon />,
            },
          ],
        },
      ],
      settingsItems: [
        {
          title: "Project Settings",
          url: `/projects/${projectId}/settings`,
          icon: <Settings2Icon />,
        },
      ],
    }
  }

  const projectsUrl = organizationId
    ? `/organizations/${organizationId}/projects`
    : "/organizations"
  const settingsUrl = organizationId
    ? `/organizations/${organizationId}/settings`
    : "/organizations"

  return {
    sections: [
      {
        title: "Overview",
        items: [{ title: "Projects", url: projectsUrl, icon: <FolderIcon /> }],
      },
    ],
    settingsItems: [
      {
        title: "Organization Settings",
        url: settingsUrl,
        icon: <Settings2Icon />,
      },
    ],
  }
}
