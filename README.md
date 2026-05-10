# Finanzas Personales

Aplicación de gestión de finanzas personales construida con Next.js, Supabase y TypeScript.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 App Router |
| Base de datos | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth · Google OAuth |
| Estado global | Zustand v5 |
| Server state | TanStack Query v5 |
| UI | Base UI + Tailwind CSS v4 |
| Charts | Recharts |
| Validación | Zod v4 |
| Drag & drop | @dnd-kit |
| Lenguaje | TypeScript strict |

## Setup local

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd finanzas-personales
npm install
```

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo servidor) |
| `NEXT_PUBLIC_APP_URL` | URL de la app |
| `CRON_SECRET` | Secret para proteger endpoints cron |

### 3. Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com)
2. Aplicá las migraciones desde `supabase/migrations/` en el SQL Editor
3. Habilitá Google OAuth en **Authentication → Providers → Google**
4. Agregá `http://localhost:3000/auth/callback` como Redirect URL

### 4. Desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run type-check   # TypeScript sin emit
npm run lint         # ESLint
npm run analyze      # Bundle analyzer (ANALYZE=true)
```

## Deploy en Vercel

### Variables de entorno en Vercel

Configurá todas las variables de `.env.local.example` en **Settings → Environment Variables**.

Generá el `CRON_SECRET`:

```bash
openssl rand -hex 32
```

### Cron jobs

Definidos en `vercel.json`:
- `0 8 * * *` — Procesa recurrentes vencidos
- `0 2 1 * *` — Genera snapshot mensual de patrimonio

### Google OAuth

Actualizá las Redirect URLs en Google Cloud Console con el dominio de Vercel:
```
https://tu-app.vercel.app/auth/callback
```

Y también en Supabase → Authentication → URL Configuration.

### Ejecutar deploy

```bash
vercel --prod
```

## Estructura

```
src/
├── app/
│   ├── (auth)/               # Login, onboarding
│   ├── (dashboard)/          # Área autenticada
│   │   ├── page.tsx          # Dashboard overview
│   │   ├── transactions/     # CRUD transacciones + importación CSV
│   │   ├── budgets/          # Presupuestos con tracking
│   │   ├── goals/            # Metas de ahorro
│   │   ├── recurring/        # Gastos recurrentes
│   │   ├── reports/          # Reportes y análisis
│   │   └── settings/         # Perfil, cuentas, categorías
│   └── api/
│       └── cron/             # Endpoints para Vercel Cron
├── components/
│   ├── ui/                   # Primitivos (Base UI + shadcn)
│   ├── charts/               # FlowChart, CategoryDonut
│   ├── forms/                # TransactionForm, BudgetForm, etc.
│   ├── layout/               # Sidebar, Header, MobileNav
│   ├── reports/              # Tabs de reportes
│   ├── settings/             # Tabs de configuración
│   └── shared/               # StatCard, BudgetCard, AlertBanner, etc.
├── hooks/                    # useTransactions, useTransactionMutations, etc.
├── lib/
│   ├── supabase/             # Clients (browser/server) + queries por tabla
│   ├── validations/          # Schemas Zod
│   └── utils/                # cn, csv download
├── stores/                   # ui.store, finance.store (Zustand)
└── types/                    # domain.ts, database.ts
```

## Análisis de bundle

```bash
ANALYZE=true npm run build
```

## CI

GitHub Actions en `.github/workflows/ci.yml` corre en cada PR:
- `tsc --noEmit`
- `next lint`
- `next build`

## Licencia

MIT
