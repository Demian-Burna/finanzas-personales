// Re-export the auto-generated raw schema types (for supabase-js generic).
export type { Database, Json, Tables, TablesInsert, TablesUpdate } from './database'

// Re-export the domain layer (narrowed enums, JSON shapes, joined views).
export * from './domain'

// ── App-wide shared types ────────────────────────────────────
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

export interface CursorPage<T, Cursor = string> {
  items: T[]
  nextCursor: Cursor | null
  hasMore: boolean
}

export interface SelectOption<T = string> {
  label: string
  value: T
}

export interface DateRange {
  start: string // ISO date 'YYYY-MM-DD'
  end: string
}
