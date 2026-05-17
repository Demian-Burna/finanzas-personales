'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { deleteAllDataAction } from '@/app/(dashboard)/settings/actions'
import { exportMonthlySummaryAction, exportCashFlowAction } from '@/app/(dashboard)/reports/actions'
import { downloadCsv } from '@/lib/utils/csv'

export function DataTab() {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, startDelete] = useTransition()
  const [isExporting, startExport] = useTransition()

  function handleDeleteAll() {
    startDelete(async () => {
      const res = await deleteAllDataAction('ELIMINAR')
      if (!res.ok) { toast.error(res.error); return }
      toast.success('Todos los datos han sido eliminados')
      setDeleteOpen(false)
    })
  }

  function handleExportAll() {
    const now = new Date()
    startExport(async () => {
      const [summary, flow] = await Promise.all([
        exportMonthlySummaryAction(now.getFullYear(), now.getMonth() + 1),
        exportCashFlowAction(),
      ])
      if (summary.ok) downloadCsv(summary.data, `fintrack-transacciones-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`)
      if (flow.ok) downloadCsv(flow.data, 'fintrack-flujo-de-caja.csv')
      toast.success('Exportación completada')
    })
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Export */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Exportar datos</h3>
        <p className="text-xs text-muted-foreground">
          Descargá tus datos en formato CSV para usarlos en Excel u otras aplicaciones.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportAll} disabled={isExporting} className="gap-1.5">
            <Download className="size-3.5" />
            {isExporting ? 'Exportando...' : 'Exportar todo (CSV)'}
          </Button>
        </div>
      </section>

      {/* Import */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Importar datos</h3>
        <p className="text-xs text-muted-foreground">
          Importá transacciones desde un archivo CSV de otro banco o aplicación.
        </p>
        <Button variant="outline" size="sm" render={<Link href="/transactions/import" />} className="gap-1.5">
          <Upload className="size-3.5" />
          Ir al importador
        </Button>
      </section>

      {/* Danger zone */}
      <section className="space-y-4 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="flex items-start gap-2">
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-destructive">Zona peligrosa</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Esta acción elimina todas tus transacciones, presupuestos, recurrentes y metas. No se puede deshacer.
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
        >
          Eliminar mis datos...
        </Button>
      </section>

      <ConfirmModal
        open={deleteOpen}
        variant="type-to-confirm"
        title="Eliminar todos los datos"
        body="Esto va a eliminar todas tus transacciones, presupuestos, recurrentes y metas. No se puede deshacer."
        confirmWord="ELIMINAR"
        confirmLabel="Eliminar todo"
        destructive
        isPending={isDeleting}
        onConfirm={handleDeleteAll}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}
