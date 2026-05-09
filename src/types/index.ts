export type { Database, Row, Insert, Update } from './database'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SelectOption {
  label: string
  value: string
}
