import type { PostgrestError } from '@supabase/supabase-js'

export interface AppError {
  code: string
  message: string
  details?: string
}

export function toAppError(error: PostgrestError | Error | unknown): AppError {
  if (error !== null && typeof error === 'object' && 'code' in error && 'message' in error) {
    const pg = error as PostgrestError
    return {
      code: pg.code ?? 'UNKNOWN',
      message: pg.message,
      details: pg.details ?? undefined,
    }
  }
  if (error instanceof Error) {
    return { code: 'CLIENT_ERROR', message: error.message }
  }
  return { code: 'UNKNOWN', message: 'Ha ocurrido un error inesperado' }
}

export function isUniqueViolation(error: PostgrestError): boolean {
  return error.code === '23505'
}

export function isForeignKeyViolation(error: PostgrestError): boolean {
  return error.code === '23503'
}

export function isNotFound(error: PostgrestError): boolean {
  // PGRST116 = "The result contains 0 rows"
  return error.code === 'PGRST116'
}
