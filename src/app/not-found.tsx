import { ErrorScreen } from '@/components/shared/ErrorScreen'

export default function NotFound() {
  return (
    <ErrorScreen
      icon="?"
      title="No encontramos esta pantalla"
      body="El link al que llegaste no existe o ya no está disponible. Volvé al inicio y probá de nuevo desde el menú."
      actions={[
        { label: 'Volver al inicio', href: '/' },
        { label: 'Reportar este link', href: 'mailto:demianburna@gmail.com?subject=Link%20roto' },
      ]}
    />
  )
}
