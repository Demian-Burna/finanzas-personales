'use client'

import { useTransition } from 'react'
import { useTheme } from 'next-themes'
import { Menu, Sun, Moon, Monitor, LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PeriodSelector } from '@/components/layout/PeriodSelector'
import { useUIStore } from '@/stores/ui.store'
import { signOut } from '@/app/(dashboard)/actions'

interface Props {
  user: User | null
}

const avatarLetter = (user: User | null) => {
  const name = (user?.user_metadata?.['full_name'] as string | undefined) ??
    user?.email ??
    '?'
  return name[0]?.toUpperCase() ?? '?'
}

export function Header({ user }: Props) {
  const { toggleSidebar } = useUIStore()
  const { setTheme, resolvedTheme } = useTheme()
  const [, startTransition] = useTransition()

  const avatarUrl = user?.user_metadata?.['avatar_url'] as string | undefined
  const displayName =
    (user?.user_metadata?.['full_name'] as string | undefined) ?? user?.email ?? ''

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
    })
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </Button>

      {/* Period selector — centered */}
      <div className="flex flex-1 items-center justify-center">
        <PeriodSelector />
      </div>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex size-8 items-center justify-center rounded-full ring-2 ring-border hover:ring-primary/50 transition-all focus:outline-none"
          aria-label="Menú de usuario"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="size-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {avatarLetter(user)}
            </span>
          )}
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium leading-none">{displayName}</span>
              {user?.email && (
                <span className="text-xs text-muted-foreground">{user.email}</span>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="p-0">
            <Link href="/settings" className="flex w-full items-center gap-2 px-1.5 py-1">
              <Settings className="size-4" />
              Configuración
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Theme toggle */}
          <DropdownMenuItem
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-2"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
            {resolvedTheme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setTheme('system')}
            className="flex items-center gap-2"
          >
            <Monitor className="size-4" />
            Usar sistema
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleSignOut}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
