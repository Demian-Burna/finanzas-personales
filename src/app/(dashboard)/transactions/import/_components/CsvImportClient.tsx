'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { AccountWithType } from '@/lib/supabase/queries/accounts'
import { importCsvAction } from '../actions'

interface Props {
  accounts: AccountWithType[]
}

type ColumnKey = 'date' | 'description' | 'amount' | 'type' | 'skip'

const COLUMN_OPTIONS: { value: ColumnKey; label: string }[] = [
  { value: 'date', label: 'Fecha' },
  { value: 'description', label: 'Descripción' },
  { value: 'amount', label: 'Monto' },
  { value: 'type', label: 'Tipo (income/expense)' },
  { value: 'skip', label: 'Ignorar columna' },
]

function detectSeparator(line: string): string {
  const counts = { ',': 0, ';': 0, '\t': 0 }
  for (const ch of line) {
    if (ch === ',') counts[',']++
    else if (ch === ';') counts[';']++
    else if (ch === '\t') counts['\t']++
  }
  return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? ','
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const sep = detectSeparator(lines[0] ?? '')
  const headers = (lines[0] ?? '').split(sep).map((h) => h.trim().replace(/^"|"$/g, ''))
  const rows = lines.slice(1, 6).map((line) =>
    line.split(sep).map((cell) => cell.trim().replace(/^"|"$/g, '')),
  )
  return { headers, rows }
}

export function CsvImportClient({ accounts }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<{ headers: string[]; rows: string[][] } | null>(null)
  const [rawText, setRawText] = useState('')
  const [mapping, setMapping] = useState<Record<number, ColumnKey>>({})
  const [accountId, setAccountId] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback((f: File) => {
    setFile(f)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? ''
      setRawText(text)
      const parsed = parseCsv(text)
      setParsed(parsed)
      const defaultMapping: Record<number, ColumnKey> = {}
      parsed.headers.forEach((h, i) => {
        const lower = h.toLowerCase()
        if (lower.includes('fecha') || lower.includes('date')) defaultMapping[i] = 'date'
        else if (lower.includes('desc') || lower.includes('concepto') || lower.includes('detalle')) defaultMapping[i] = 'description'
        else if (lower.includes('monto') || lower.includes('amount') || lower.includes('importe')) defaultMapping[i] = 'amount'
        else if (lower.includes('tipo') || lower.includes('type')) defaultMapping[i] = 'type'
        else defaultMapping[i] = 'skip'
      })
      setMapping(defaultMapping)
    }
    reader.readAsText(f)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const f = e.dataTransfer.files[0]
      if (f) loadFile(f)
    },
    [loadFile],
  )

  async function handleImport() {
    if (!rawText || !accountId) return
    setIsPending(true)
    setError(null)

    const formData = new FormData()
    formData.append('csv', rawText)
    formData.append('accountId', accountId)
    formData.append('mapping', JSON.stringify(mapping))

    const res = await importCsvAction(formData)
    setIsPending(false)

    if (!res.ok) {
      setError(res.error)
    } else {
      setResult(res.data)
      setFile(null)
      setParsed(null)
      setRawText('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      {!parsed && (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-12 transition-colors cursor-pointer',
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        >
          <Upload className="size-10 text-muted-foreground/50" />
          <div className="text-center">
            <p className="text-sm font-medium">Arrastrá un archivo CSV o hacé clic para seleccionar</p>
            <p className="text-xs text-muted-foreground mt-1">Separdor automático: coma, punto y coma o tabulador</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f) }}
          />
        </div>
      )}

      {/* File selected */}
      {file && parsed && (
        <>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            <span className="font-medium flex-1 truncate">{file.name}</span>
            <button onClick={() => { setFile(null); setParsed(null); setRawText('') }} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Vista previa (primeras 5 filas)</p>
            <div className="overflow-x-auto rounded-lg border text-xs">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    {parsed.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.map((row, ri) => (
                    <tr key={ri} className="border-t">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-muted-foreground">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Column mapping */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Mapeo de columnas</p>
            <div className="grid gap-2">
              {parsed.headers.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-32 truncate text-sm">{h}</span>
                  <span className="text-muted-foreground">→</span>
                  <Select
                    value={mapping[i] ?? 'skip'}
                    onValueChange={(v) => setMapping((prev) => ({ ...prev, [i]: v as ColumnKey }))}
                  >
                    <SelectTrigger size="sm" className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLUMN_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Account selector */}
          <div>
            <Label>Cuenta destino</Label>
            <Select value={accountId} onValueChange={(v) => setAccountId(v ?? '')}>
              <SelectTrigger className="mt-1 w-full max-w-xs">
                <SelectValue placeholder="Seleccioná una cuenta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <Button onClick={handleImport} disabled={isPending || !accountId} className="w-full sm:w-auto">
            {isPending ? 'Importando...' : 'Importar transacciones'}
          </Button>
        </>
      )}

      {/* Result */}
      {result && (
        <div className="flex items-start gap-3 rounded-xl border bg-card p-5 shadow-sm">
          <CheckCircle2 className="size-5 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Importación completada</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {result.imported} transaccion{result.imported !== 1 ? 'es' : ''} importada{result.imported !== 1 ? 's' : ''}
              {result.errors > 0 && ` · ${result.errors} error${result.errors !== 1 ? 'es' : ''} ignorado${result.errors !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
