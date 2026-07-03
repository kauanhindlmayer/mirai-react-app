export type PaginatedList<T> = {
  items: T[]
  totalCount: number
  pageSize: number
  page: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  totalPages: number
}

export type PaginationFilter = {
  page: number
  pageSize: number
  sort: string
  searchTerm: string
}

export type ApiErrorResponse = {
  type: string
  title: string
  status: number
  requestId: string
  detail?: string
  errors?: Record<string, string[]>
}

export type HateoasResponse = {
  _links: Link[]
}

export type Link = {
  href: string
  rel: string
  method: string
}

export type Author = {
  id: string
  name: string
  imageUrl: string
}

export type Comment = {
  id: string
  author: Author
  content: string
  createdAtUtc: string
  updatedAtUtc: string
  isPending?: boolean
}

export type AddCommentRequest = {
  content: string
}

export type UpdateCommentRequest = {
  content: string
}
