import type { Comment } from "@/types/common"

export type WorkItem = {
  id: string
  code: number
  title: string
  description?: string
  acceptanceCriteria?: string
  type: WorkItemType
  status: WorkItemStatus
  planning?: Planning
  classification?: Classification
  parentWorkItem?: RelatedWorkItemResponse
  childWorkItems: RelatedWorkItemResponse[]
  tags: TagBriefResponse[]
  comments: Comment[]
  attachments: WorkItemAttachment[]
  outgoingLinks: WorkItemLink[]
  incomingLinks: WorkItemLink[]
  pullRequestLinks: WorkItemPullRequestLink[]
  assigneeId?: string
  assignee?: AssigneeResponse
  createdAtUtc: string
  updatedAtUtc?: string
}

/**
 * Lightweight shape returned by the work items list endpoint — distinct from
 * `WorkItem` (the full detail shape returned by the single-item GET). The
 * backend intentionally omits planning/classification/comments/etc. here.
 */
export type WorkItemSummary = {
  id: string
  code: number
  title: string
  status: WorkItemStatus
  type: WorkItemType
  assignee?: WorkItemSummaryAssignee
  tags: TagBriefResponse[]
  createdAtUtc: string
  updatedAtUtc?: string
}

export type WorkItemSummaryAssignee = {
  id: string
  name: string
  imageUrl?: string
}

export type Planning = {
  storyPoints?: number
  priority?: number
}

export type Classification = {
  valueArea?: ValueArea
}

export const ValueArea = {
  Architectural: "Architectural",
  Business: "Business",
} as const

export type ValueArea = (typeof ValueArea)[keyof typeof ValueArea]

export type CreateWorkItemRequest = {
  title: string
  type: WorkItemType
  assignedTeamId: string
}

export type TagBriefResponse = {
  id: string
  name: string
  color: string
}

export type AssigneeResponse = {
  id: string
  fullName: string
  email: string
  imageUrl?: string
}

export type ProjectUserResponse = {
  id: string
  fullName: string
  email: string
  imageUrl?: string
  roleId: string
  roleName: string
}

export type ResolvedUserResponse = {
  id: string
  fullName: string
  imageUrl?: string
}

export const WorkItemStatus = {
  New: "New",
  Active: "Active",
  Resolved: "Resolved",
  Closed: "Closed",
  Removed: "Removed",
} as const

export type WorkItemStatus =
  (typeof WorkItemStatus)[keyof typeof WorkItemStatus]

export const WorkItemType = {
  UserStory: "UserStory",
  Bug: "Bug",
  Defect: "Defect",
  Epic: "Epic",
  Feature: "Feature",
} as const

export type WorkItemType = (typeof WorkItemType)[keyof typeof WorkItemType]

export type WorkItemsStats = {
  workItemsCreated: number
  workItemsCompleted: number
}

export type WorkItemLink = {
  id: string
  targetWorkItem: RelatedWorkItemResponse
  linkType: string
  comment?: string
}

export type RelatedWorkItemResponse = {
  id: string
  code: number
  title: string
  type: WorkItemType
  status: WorkItemStatus
  assignee?: WorkItemSummaryAssignee
}

export const WorkItemLinkType = {
  Related: "Related",
  Affects: "Affects",
  Predecessor: "Predecessor",
  Duplicate: "Duplicate",
} as const

export type WorkItemLinkType =
  (typeof WorkItemLinkType)[keyof typeof WorkItemLinkType]

export type CreateWorkItemLinkRequest = {
  targetWorkItemId: string
  linkType: WorkItemLinkType
  comment?: string
}

export type WorkItemAttachment = {
  id: string
  fileName: string
  contentType: string
  fileSizeBytes: number
  authorId: string
  createdAtUtc: string
}

export const PullRequestLinkState = {
  Open: "Open",
  Merged: "Merged",
  Closed: "Closed",
} as const

export type PullRequestLinkState =
  (typeof PullRequestLinkState)[keyof typeof PullRequestLinkState]

export const PullRequestLinkSource = {
  Automatic: "Automatic",
  Manual: "Manual",
} as const

export type PullRequestLinkSource =
  (typeof PullRequestLinkSource)[keyof typeof PullRequestLinkSource]

export type WorkItemPullRequestLink = {
  id: string
  pullRequestNumber: number
  title: string
  htmlUrl: string
  state: PullRequestLinkState
  authorLogin?: string
  source: PullRequestLinkSource
  linkedAtUtc: string
}

export type LinkPullRequestRequest = {
  pullRequestNumber: number
}

export type WorkItemChangeSet = {
  id: string
  changedBy?: WorkItemChangeActor
  systemActor?: string
  changes: WorkItemChange[]
  createdAtUtc: string
}

export type WorkItemChangeActor = {
  id: string
  name: string
}

export type WorkItemChange = {
  fieldName: string
  oldValue?: string
  newValue?: string
}
