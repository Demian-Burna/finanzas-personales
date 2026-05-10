import { redirect } from 'next/navigation'

// /accounts redirects to Settings → tab Cuentas
export default function AccountsPage() {
  redirect('/settings')
}
