# Finanzas Personales

Aplicación de gestión de finanzas personales construida con Next.js 14, Supabase y TypeScript.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Estado global**: Zustand
- **Server state / caché**: TanStack Query v5
- **UI**: shadcn/ui + Tailwind CSS v3
- **Validación**: Zod
- **Lenguaje**: TypeScript estricto

## Requisitos previos

- Node.js 18.17+
- npm 9+
- Cuenta en [Supabase](https://supabase.com)

## Setup

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd finanzas-personales
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (solo en servidor) |
| `NEXT_PUBLIC_APP_URL` | URL de la app (localhost:3000 en desarrollo) |

### 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Copia la URL y las claves desde **Project Settings → API**
3. Ejecuta las migraciones desde `supabase/migrations/` (próximamente)

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Scripts disponibles

```bash
npm run dev          # Servidor de desarrollo (Turbopack)
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # ESLint
npm run lint:fix     # ESLint con auto-fix
npm run format       # Prettier
npm run analyze      # Bundle analyzer (requiere build previo)
npm run type-check   # Verificación de tipos TypeScript
```

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (dashboard)/           # Área autenticada
│   │   ├── layout.tsx         # Layout con sidebar/nav
│   │   ├── page.tsx           # Overview/resumen
│   │   ├── transactions/      # Transacciones
│   │   ├── budgets/           # Presupuestos
│   │   ├── goals/             # Metas financieras
│   │   ├── reports/           # Reportes y análisis
│   │   └── settings/          # Configuración
│   ├── api/                   # Route handlers
│   ├── layout.tsx             # Root layout (fuentes, providers)
│   └── globals.css
├── components/
│   ├── ui/                    # Componentes shadcn/ui
│   ├── charts/                # Gráficas personalizadas
│   ├── forms/                 # Formularios de dominio
│   ├── layout/                # Sidebar, Navbar, etc.
│   └── shared/                # Componentes reutilizables
├── lib/
│   ├── supabase/              # Clientes Supabase (client/server/middleware)
│   ├── validations/           # Schemas Zod
│   ├── utils/                 # Funciones utilitarias
│   └── constants/             # Constantes de dominio
├── hooks/                     # Custom React hooks
├── stores/                    # Zustand stores
├── types/                     # Tipos TypeScript globales
└── styles/                    # Estilos adicionales
```

## Análisis de bundle

```bash
ANALYZE=true npm run build
```

## Licencia

MIT
