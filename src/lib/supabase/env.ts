// Strips BOM (U+FEFF) and surrounding whitespace that PowerShell/Windows shells
// can inject into env var values when piped via stdin to CLI tools.
function clean(value: string | undefined): string {
  return (value ?? '').replace(/^﻿/, '').trim()
}

export const SUPABASE_URL = clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
export const SUPABASE_ANON_KEY = clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
