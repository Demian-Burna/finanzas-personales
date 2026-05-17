'use client'

import { useState, useTransition } from 'react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { completeOnboarding } from '../actions'

interface AccountType {
  id: string
  name: string
  nature: 'asset' | 'liability'
  icon: string | null
}

interface Props {
  accountTypes: AccountType[]
  completeOnboardingAction: typeof completeOnboarding
}

// ── Slide visuals ─────────────────────────────────────────────────────────────

function PatrimonyIllustration() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-56 rounded-2xl px-5 py-4 text-white" style={{ background: 'linear-gradient(155deg, oklch(0.28 0 0), oklch(0.18 0 0))' }}>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-white/40">Patrimonio neto</p>
        <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">$8.420.500</p>
        <div className="mt-3 h-px bg-white/10" />
        <div className="mt-2.5 grid grid-cols-3 gap-1">
          {[['Ingresos','$1.850k'],['Gastos','$1.245k'],['Ahorro','32.7%']].map(([l,v]) => (
            <div key={l}>
              <p className="text-[8px] text-white/40">{l}</p>
              <p className="text-[10px] font-semibold text-white/80">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BudgetsIllustration() {
  const rings = [
    { color: '#ef4444', pct: 109, label: 'Supermercado' },
    { color: '#f59e0b', pct: 75,  label: 'Restaurantes' },
    { color: '#10b981', pct: 38,  label: 'Transporte' },
  ]
  return (
    <div className="flex items-center justify-center gap-5">
      {rings.map(({ color, pct, label }) => {
        const r = 28
        const circ = 2 * Math.PI * r
        const dash = (Math.min(pct, 100) / 100) * circ
        return (
          <div key={label} className="flex flex-col items-center gap-2">
            <svg width={72} height={72} viewBox="0 0 72 72">
              <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={7} />
              <circle
                cx={36} cy={36} r={r} fill="none"
                stroke={color} strokeWidth={7}
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
              />
              <text x={36} y={40} textAnchor="middle" fontSize={11} fontWeight={700} fill="white">
                {pct}%
              </text>
            </svg>
            <p className="text-[9px] text-white/50 text-center max-w-[60px] leading-tight">{label}</p>
          </div>
        )
      })}
    </div>
  )
}

function GoalsIllustration() {
  const goals = [
    { icon: '✈️', name: 'Viaje a Japón',   pct: 82 },
    { icon: '🏠', name: 'Fondo emergencia', pct: 77 },
    { icon: '💻', name: 'Notebook nueva',  pct: 60 },
  ]
  return (
    <div className="flex flex-col gap-2 w-56">
      {goals.map(({ icon, name, pct }) => (
        <div key={name} className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{icon}</span>
              <span className="text-xs font-medium text-white/80">{name}</span>
            </div>
            <span className="text-[10px] font-bold text-white/60">{pct}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: `${pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Slide definitions ─────────────────────────────────────────────────────────

const SLIDES = [
  {
    title: 'Todas tus cuentas\nen un mismo lugar',
    subtitle: 'Cuentas bancarias, tarjetas, billeteras, efectivo. Sumá todo y mirá tu patrimonio crecer.',
    illustration: <PatrimonyIllustration />,
  },
  {
    title: 'Presupuestos que\nte avisan a tiempo',
    subtitle: 'Definí topes por categoría y recibí alertas cuando estés cerca. Sin sustos a fin de mes.',
    illustration: <BudgetsIllustration />,
  },
  {
    title: 'Metas que se\nsienten posibles',
    subtitle: 'Ponete objetivos, mirá tu progreso y dejá que la app te diga cuánto tenés que aportar cada mes.',
    illustration: <GoalsIllustration />,
  },
]

// ── Account type rows ─────────────────────────────────────────────────────────

const ACCOUNT_DISPLAY: Record<string, { label: string; subtitle: string; emoji: string }> = {
  cash:        { label: 'Efectivo',          subtitle: 'Lo que llevás en el bolsillo',       emoji: '💵' },
  checking:    { label: 'Banco',             subtitle: 'Caja de ahorro o cuenta corriente',  emoji: '🏦' },
  savings:     { label: 'Banco',             subtitle: 'Caja de ahorro o cuenta corriente',  emoji: '🏦' },
  credit_card: { label: 'Tarjeta de crédito', subtitle: 'Visa, Master, Amex...',             emoji: '💳' },
  investment:  { label: 'Inversión',         subtitle: 'IOL, Balanz, Cocos...',              emoji: '📈' },
  loan:        { label: 'Billetera virtual', subtitle: 'Mercado Pago, Ualá, Naranja X',      emoji: '📱' },
}

// ── Main component ────────────────────────────────────────────────────────────

export function OnboardingWizard({ accountTypes, completeOnboardingAction }: Props) {
  // slide 0-2 = intro, slide 3 = account picker
  const [slide, setSlide] = useState(0)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isIntro = slide < 3
  const assetTypes = accountTypes.filter((t) => t.nature === 'asset')

  function next() {
    if (slide < 3) setSlide((s) => s + 1)
  }

  function skip() {
    setSlide(3)
  }

  function finish(typeId: string | null) {
    startTransition(async () => {
      await completeOnboardingAction({
        currency_code: 'ARS',
        timezone: 'America/Argentina/Buenos_Aires',
        locale: 'es-AR',
        account_type_id: typeId ?? (assetTypes[0]?.id ?? ''),
        account_name: 'Mi cuenta',
        initial_balance: 0,
      })
    })
  }

  // ── Intro slides ──────────────────────────────────────────────────────────
  if (isIntro) {
    const s = SLIDES[slide]!
    return (
      <div className="flex min-h-screen flex-col bg-black text-white">
        {/* Progress + skip */}
        <div className="flex items-center justify-between px-6 pt-12 pb-4">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === slide ? 'w-8 bg-white' : i < slide ? 'w-8 bg-white/40' : 'w-8 bg-white/20',
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={skip}
            className="text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            Saltar
          </button>
        </div>

        {/* Illustration */}
        <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6">
          <div className="flex items-center justify-center min-h-[200px]">
            {s.illustration}
          </div>

          {/* Text */}
          <div className="space-y-3 text-center max-w-xs">
            <h1 className="text-2xl font-bold leading-tight whitespace-pre-line">
              {s.title}
            </h1>
            <p className="text-sm text-white/60 leading-relaxed">{s.subtitle}</p>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-12">
          <button
            type="button"
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-semibold text-black hover:bg-white/90 active:bg-white/80 transition-colors"
          >
            {slide < 2 ? 'Siguiente' : 'Empezar'}
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  // ── Account picker ────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col bg-background px-5 pt-12 pb-10">
      <div className="mb-2">
        <div className="flex gap-1.5 mb-8">
          {SLIDES.map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-muted" />
          ))}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Agregá tu primera cuenta</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Podés sumar más después. Empezá por donde llega tu sueldo o tu billetera principal.
        </p>
      </div>

      <div className="mt-6 space-y-2">
        {assetTypes.map((t) => {
          const display = ACCOUNT_DISPLAY[t.name] ?? { label: t.name, subtitle: '', emoji: t.icon ?? '🏦' }
          const selected = selectedTypeId === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedTypeId(t.id)}
              className={cn(
                'flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-colors',
                selected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40 hover:bg-muted/30',
              )}
            >
              <span className="text-2xl shrink-0">{display.emoji}</span>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{display.label}</p>
                <p className="text-xs-plus text-muted-foreground mt-0.5">{display.subtitle}</p>
              </div>
              <ChevronRight className={cn('ml-auto size-4 shrink-0 transition-colors', selected ? 'text-primary' : 'text-muted-foreground/40')} />
            </button>
          )
        })}
      </div>

      <div className="mt-auto pt-8 space-y-3">
        <button
          type="button"
          disabled={isPending || !selectedTypeId}
          onClick={() => finish(selectedTypeId)}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold transition-colors',
            selectedTypeId
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          {isPending ? 'Configurando...' : 'Continuar'}
          {!isPending && <ChevronRight className="size-4" />}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => finish(null)}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Lo hago después
        </button>
      </div>
    </div>
  )
}
