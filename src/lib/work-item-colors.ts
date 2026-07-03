import {
  BookmarkIcon,
  BugIcon,
  SparklesIcon,
  TriangleAlertIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import { WorkItemStatus, WorkItemType } from "@/types/work-items"

export const WORK_ITEM_STATUS_COLORS: Record<WorkItemStatus, string> = {
  [WorkItemStatus.New]:
    "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  [WorkItemStatus.Active]:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  [WorkItemStatus.Resolved]:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  [WorkItemStatus.Closed]:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-400",
  [WorkItemStatus.Removed]:
    "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
}

export const WORK_ITEM_TYPE_COLORS: Record<WorkItemType, string> = {
  [WorkItemType.UserStory]:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  [WorkItemType.Bug]:
    "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400",
  [WorkItemType.Defect]:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400",
  [WorkItemType.Epic]:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400",
  [WorkItemType.Feature]:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400",
}

export const WORK_ITEM_TYPE_ICONS: Record<WorkItemType, LucideIcon> = {
  [WorkItemType.UserStory]: BookmarkIcon,
  [WorkItemType.Bug]: BugIcon,
  [WorkItemType.Defect]: TriangleAlertIcon,
  [WorkItemType.Epic]: ZapIcon,
  [WorkItemType.Feature]: SparklesIcon,
}
