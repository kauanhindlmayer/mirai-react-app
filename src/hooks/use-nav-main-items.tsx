import { useParams } from "react-router"
import {
  BookIcon,
  BookOpenIcon,
  ClipboardPenIcon,
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

import type { NavMainItem } from "@/components/nav-main"

export function useNavMainItems(): NavMainItem[] {
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
        icon: <ClipboardPenIcon />,
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
      {
        title: "Settings",
        icon: <Settings2Icon />,
        items: [
          {
            title: "Project Settings",
            url: `/projects/${projectId}/settings`,
            icon: <Settings2Icon />,
          },
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
      items: [{ title: "Projects", url: projectsUrl, icon: <FolderIcon /> }],
    },
    {
      title: "Settings",
      icon: <Settings2Icon />,
      items: [
        {
          title: "Organization Settings",
          url: settingsUrl,
          icon: <Settings2Icon />,
        },
      ],
    },
  ]
}
