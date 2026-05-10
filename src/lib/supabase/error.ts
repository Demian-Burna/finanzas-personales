// ============================================================
// Supabase error helpers — typed result handling
// ============================================================
// Postgrest responses come back as `{ data, error }`. These
// helpers narrow them into a discriminated union and expose a
// `unwrap()` that throws a structured QueryError on failure
// (good for use inside Server Actions where the throw becomes
// a redirect / toast in the client boundary).
// ============================================================

import type { PostgrestError } from '@supabase/supabase-js'

// ── Discriminated result type ───────────────────────────────
export type QueryResult<T> = { data: T; error: null } | { data: null; error: QueryError }

// ── Custom typed error ──────────────────────────────────────
export class QueryError extends Error {
  readonly code: string | null
  readonly details: string | null
  readonly hint: string | null

  constructor(error: PostgrestError | { message: string }) {
    super(error.message)
    this.name = 'QueryError'
    this.code = 'code' in error ? error.code : null
    this.details = 'details' in error ? (error.details ?? null) : null
    this.hint = 'hint' in error ? (error.hint ?? null) : null
  }
}

// ── unwrap: throws on error, returns data ───────────────────
// Usage:
//   const data = unwrap(await supabase.from('accounts').select('*'))
export function unwrap<T>(response: { data: T | null; error: PostgrestError | null }): T {
  if (response.error) throw new QueryError(response.error)
  if (response.data === null) {
    throw new QueryError({ message: 'Query returned null data' })
  }
  return response.data
}

// ── unwrapMaybe: returns null instead of throwing on PGRST116 ─
// Useful for `.single()` queries that can legitimately be empty.
export function unwrapMaybe<T>(response: {
  data: T | null
  error: PostgrestError | null
}): T | null {
  if (response.error) {
    // PGRST116 = "Results contain 0 rows" from .single()
    if (response.error.code === 'PGRST116') return null
    throw new QueryError(response.error)
  }
  return response.data
}

// ── toResult: converts to discriminated union ───────────────
// Use in places where you'd rather match than try/catch.
export function toResult<T>(response: {
  data: T | null
  error: PostgrestError | null
}): QueryResult<T> {
  if (response.error) return { data: null, error: new QueryError(response.error) }
  if (response.data === null) {
    return { data: null, error: new QueryError({ message: 'Query returned null data' }) }
  }
  return { data: response.data, error: null }
}

// Postgres unique-violation helper.
export function isUniqueViolation(err: unknown): boolean {
  return err instanceof QueryError && err.code === '23505'
}

// Postgres foreign-key-violation helper.
export function isForeignKeyViolation(err: unknown): boolean {
  return err instanceof QueryError && err.code === '23503'
}
