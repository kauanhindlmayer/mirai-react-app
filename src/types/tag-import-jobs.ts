export type TagImportJob = {
  id: string
  status: TagImportJobStatus
  fileName: string
  totalRecords: number
  processedRecords: number
  successfulRecords: number
  failedRecords: number
  errors: string[]
  createdAtUtc: string
  completedAtUtc?: string
}

export const TagImportJobStatus = {
  Pending: "Pending",
  Processing: "Processing",
  Completed: "Completed",
  Failed: "Failed",
} as const

export type TagImportJobStatus = (typeof TagImportJobStatus)[keyof typeof TagImportJobStatus]
