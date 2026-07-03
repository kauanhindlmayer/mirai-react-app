import type { Comment } from "@/types/common"

export type WorkItem = {
  id?: string
  code: number
  title: string
  description?: string
  acceptanceCriteria?: string
  type: WorkItemType
  status: WorkItemStatus
  planning: Planning
  classification: Classification
  tags: TagBriefResponse[]
  comments: Comment[]
  attachments: WorkItemAttachment[]
  outgoingLinks: WorkItemLink[]
  incomingLinks: WorkItemLink[]
  assigneeId?: string
  assignee?: AssigneeResponse
  createdAtUtc?: string
  updatedAtUtc: string
}

export type Planning = {
  storyPoints: number
  priority: number
}

export type Classification = {
  valueArea: ValueArea
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
}

export const WorkItemStatus = {
  New: "New",
  Active: "Active",
  Resolved: "Resolved",
  Closed: "Closed",
  Removed: "Removed",
} as const

export type WorkItemStatus = (typeof WorkItemStatus)[keyof typeof WorkItemStatus]

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
}

export const WorkItemLinkType = {
  Related: "Related",
  Affects: "Affects",
  Predecessor: "Predecessor",
  Duplicate: "Duplicate",
} as const

export type WorkItemLinkType = (typeof WorkItemLinkType)[keyof typeof WorkItemLinkType]

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
  uploadedById: string
  createdAtUtc: string
}
