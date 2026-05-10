# Plan de Deploy — Finanzas Personales
**Stack:** Next.js 14 · Supabase · Vercel · Google SSO  
**Enfoque:** Base normalizada completa · Performance-first · Zero re-work

---

## Pre-requisitos (hacer antes de Claude Code)

1. Crear repo en GitHub: `finanzas-personales`
2. Crear proyecto en [supabase.com](https://supabase.com) — anotar: `Project URL`, `anon key`, `service_role key`
3. Crear proyecto en [Google Cloud Console](https://console.cloud.google.com):
   - APIs & Services → Credentials → OAuth 2.0 Client ID
   - Authorized redirect URI: `https://<tu-proyecto>.supabase.co/auth/v1/callback`
   - Anotar: `Client ID`, `Client Secret`
4. Crear cuenta en [Vercel](https://vercel.com) y conectar con GitHub
5. Instalar Claude Code: `npm install -g @anthropic-ai/claude-code`

---

## FASE 1 — Setup del proyecto y base de datos

### Prompt 1 · Scaffold inicial

```
Inicializa un proyecto Next.js 14 con App Router en este repositorio con las siguientes especificaciones de performance y arquitectura:

CONFIGURACIÓN BASE:
- Next.js 14 con App Router y TypeScript estricto
- Tailwind CSS v3 con configuración personalizada
- shadcn/ui como librería de componentes (instalar: button, card, dialog, dropdown-menu, form, input, label, select, tabs, toast, badge, calendar, popover, separator, skeleton, table, chart)
- Zustand para estado global del cliente
- React Query (TanStack Query v5) para server state y caché
- Zod para validación de schemas

PERFORMANCE:
- Configurar next.config.js con: experimental.optimizePackageImports, images.formats ['webp','avif'], compiler.removeConsole en producción
- Bundle analyzer: @next/bundle-analyzer
- Fuentes: next/font con Inter variable y preload

ESTRUCTURA DE CARPETAS:
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (overview)
│   │   ├── transactions/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/
│   │   └── (rutas de API)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn)
│   ├── charts/
│   ├── forms/
│   ├── layout/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── validations/
│   ├── utils/
│   └── constants/
├── hooks/
├── stores/ (Zustand)
├── types/
└── styles/

ARCHIVOS DE CONFIGURACIÓN:
- .env.local.example con todas las variables necesarias
- .gitignore apropiado (incluir .env.local)
- tsconfig.json con paths: @/* → ./src/*
- Prettier + ESLint configurados
- README.md con instrucciones de setup

Crea también el archivo src/types/database.ts con los tipos TypeScript que se generarán desde Supabase (placeholder por ahora).
```

---

### Prompt 2 · Schema completo de base de datos

```
Crea el schema SQL completo para Supabase en un archivo supabase/migrations/001_initial_schema.sql

PRINCIPIOS:
- Máxima normalización (3NF mínimo, BCNF donde sea posible)
- Todas las FK con índices explícitos
- Soft delete con deleted_at en tablas críticas
- Timestamps created_at/updated_at con triggers automáticos
- Row Level Security habilitado en todas las tablas
- UUIDs como PK con gen_random_uuid()

TABLAS REQUERIDAS:

-- USUARIOS Y PERFILES
profiles (
  id uuid PK FK→auth.users,
  display_name text,
  avatar_url text,
  currency_code char(3) DEFAULT 'ARS',
  locale varchar(10) DEFAULT 'es-AR',
  timezone varchar(50) DEFAULT 'America/Argentina/Buenos_Aires',
  onboarding_completed_at timestamptz,
  created_at, updated_at
)

-- CATÁLOGO DE MONEDAS
currencies (
  code char(3) PK,           -- ISO 4217: ARS, USD, EUR
  name text NOT NULL,
  symbol varchar(5) NOT NULL,
  decimal_places smallint DEFAULT 2,
  is_active boolean DEFAULT true
)

-- CUENTAS FINANCIERAS
accounts (
  id uuid PK,
  user_id uuid FK→profiles,
  account_type_id uuid FK→account_types,
  currency_code char(3) FK→currencies,
  name text NOT NULL,
  description text,
  initial_balance numeric(15,2) DEFAULT 0,
  current_balance numeric(15,2) DEFAULT 0,  -- desnormalizado para performance
  color varchar(7),           -- hex color
  icon varchar(50),
  is_active boolean DEFAULT true,
  include_in_net_worth boolean DEFAULT true,
  sort_order smallint DEFAULT 0,
  deleted_at timestamptz,
  created_at, updated_at
)

-- TIPOS DE CUENTA (catálogo)
account_types (
  id uuid PK,
  name varchar(50) UNIQUE NOT NULL,   -- checking, savings, credit_card, investment, cash, loan
  nature varchar(10) NOT NULL,        -- asset | liability
  icon varchar(50),
  sort_order smallint DEFAULT 0
)

-- CATEGORÍAS (árbol de 2 niveles)
categories (
  id uuid PK,
  user_id uuid FK→profiles NULL,  -- NULL = categoría del sistema
  parent_id uuid FK→categories NULL,  -- NULL = categoría raíz
  name text NOT NULL,
  color varchar(7),
  icon varchar(50),
  transaction_type varchar(10) NOT NULL,  -- income | expense | transfer
  is_system boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order smallint DEFAULT 0,
  deleted_at timestamptz,
  created_at, updated_at,
  UNIQUE(user_id, parent_id, name)
)

-- ETIQUETAS (tags)
tags (
  id uuid PK,
  user_id uuid FK→profiles,
  name varchar(50) NOT NULL,
  color varchar(7),
  created_at, updated_at,
  UNIQUE(user_id, name)
)

-- TRANSACCIONES
transactions (
  id uuid PK,
  user_id uuid FK→profiles,
  account_id uuid FK→accounts,
  category_id uuid FK→categories NULL,
  transfer_account_id uuid FK→accounts NULL,  -- cuenta destino en transferencias
  transfer_transaction_id uuid FK→transactions NULL,  -- transacción espejo
  currency_code char(3) FK→currencies,
  amount numeric(15,2) NOT NULL,
  amount_in_base_currency numeric(15,2),  -- calculado si hay conversión
  exchange_rate numeric(15,6) DEFAULT 1,
  transaction_type varchar(10) NOT NULL,  -- income | expense | transfer
  description text,
  notes text,
  transaction_date date NOT NULL,
  value_date date,            -- fecha de acreditación real
  is_reconciled boolean DEFAULT false,
  recurring_item_id uuid FK→recurring_items NULL,
  attachment_url text,
  created_at, updated_at,
  deleted_at timestamptz
)

-- TABLA PIVOT transacciones ↔ tags
transaction_tags (
  transaction_id uuid FK→transactions,
  tag_id uuid FK→tags,
  PRIMARY KEY (transaction_id, tag_id)
)

-- PRESUPUESTOS
budgets (
  id uuid PK,
  user_id uuid FK→profiles,
  category_id uuid FK→categories,
  period_type varchar(10) NOT NULL,  -- monthly | weekly | yearly | custom
  amount numeric(15,2) NOT NULL,
  currency_code char(3) FK→currencies,
  start_date date NOT NULL,
  end_date date,              -- NULL = indefinido
  rollover_unused boolean DEFAULT false,  -- acumular sobrante
  alert_threshold_pct smallint DEFAULT 80,  -- alertar al X%
  is_active boolean DEFAULT true,
  created_at, updated_at,
  deleted_at timestamptz
)

-- GASTOS RECURRENTES
recurring_items (
  id uuid PK,
  user_id uuid FK→profiles,
  account_id uuid FK→accounts,
  category_id uuid FK→categories NULL,
  currency_code char(3) FK→currencies,
  amount numeric(15,2) NOT NULL,
  transaction_type varchar(10) NOT NULL,
  description text NOT NULL,
  notes text,
  frequency varchar(20) NOT NULL,     -- daily | weekly | biweekly | monthly | bimonthly | quarterly | yearly
  day_of_month smallint,              -- para frecuencias mensuales
  day_of_week smallint,               -- 0-6, para frecuencias semanales
  start_date date NOT NULL,
  end_date date,
  next_occurrence_date date,
  last_executed_at timestamptz,
  is_active boolean DEFAULT true,
  auto_create boolean DEFAULT false,   -- crear automáticamente o solo recordar
  advance_notice_days smallint DEFAULT 3,
  created_at, updated_at,
  deleted_at timestamptz
)

-- METAS DE AHORRO
saving_goals (
  id uuid PK,
  user_id uuid FK→profiles,
  account_id uuid FK→accounts NULL,   -- cuenta vinculada al ahorro
  currency_code char(3) FK→currencies,
  name text NOT NULL,
  description text,
  target_amount numeric(15,2) NOT NULL,
  current_amount numeric(15,2) DEFAULT 0,  -- desnormalizado
  target_date date,
  color varchar(7),
  icon varchar(50),
  status varchar(20) DEFAULT 'active',  -- active | completed | paused | cancelled
  created_at, updated_at,
  deleted_at timestamptz
)

-- APORTES A METAS
goal_contributions (
  id uuid PK,
  goal_id uuid FK→saving_goals,
  transaction_id uuid FK→transactions NULL,  -- vinculado a transacción real
  amount numeric(15,2) NOT NULL,
  note text,
  contribution_date date NOT NULL,
  created_at, updated_at
)

-- TIPOS DE CAMBIO HISTÓRICOS
exchange_rates (
  id uuid PK,
  from_currency char(3) FK→currencies,
  to_currency char(3) FK→currencies,
  rate numeric(15,6) NOT NULL,
  rate_date date NOT NULL,
  source varchar(50),         -- manual | api_name
  created_at,
  UNIQUE(from_currency, to_currency, rate_date)
)

-- NOTIFICACIONES
notifications (
  id uuid PK,
  user_id uuid FK→profiles,
  type varchar(50) NOT NULL,  -- budget_alert | recurring_reminder | goal_milestone | etc
  title text NOT NULL,
  message text,
  related_entity_type varchar(50),  -- budget | recurring_item | goal
  related_entity_id uuid,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at
)

-- CONFIGURACIÓN DE NOTIFICACIONES
notification_preferences (
  id uuid PK,
  user_id uuid FK→profiles,
  notification_type varchar(50) NOT NULL,
  channel varchar(20) NOT NULL,   -- in_app | email
  is_enabled boolean DEFAULT true,
  UNIQUE(user_id, notification_type, channel)
)

-- REPORTES GUARDADOS / SNAPSHOTS MENSUALES
monthly_snapshots (
  id uuid PK,
  user_id uuid FK→profiles,
  snapshot_month date NOT NULL,   -- primer día del mes
  total_income numeric(15,2) DEFAULT 0,
  total_expenses numeric(15,2) DEFAULT 0,
  net_balance numeric(15,2) DEFAULT 0,
  net_worth numeric(15,2) DEFAULT 0,
  data jsonb,                     -- desglose detallado por categoría/cuenta
  created_at, updated_at,
  UNIQUE(user_id, snapshot_month)
)

TAMBIÉN CREAR:
1. Función y trigger para updated_at automático en todas las tablas
2. Función para actualizar account.current_balance después de cada insert/update/delete en transactions
3. Políticas RLS: todas las tablas con auth.uid() = user_id (y para categorías del sistema: user_id IS NULL OR user_id = auth.uid())
4. Índices en: transactions(user_id, transaction_date DESC), transactions(account_id), transactions(category_id), transactions(recurring_item_id), budgets(user_id, is_active), recurring_items(user_id, next_occurrence_date)
5. Seed data en supabase/seed.sql: monedas ISO comunes + categorías del sistema (Alimentación, Transporte, Vivienda, Salud, Educación, Entretenimiento, Ropa, Tecnología, Trabajo, Inversiones, Transferencia, etc.)

Incluye comentarios explicativos en el SQL para las decisiones de diseño importantes.
```

---

### Prompt 3 · Cliente Supabase y tipos TypeScript

```
Configura el cliente de Supabase y genera los tipos TypeScript para toda la base de datos.

1. Instalar dependencias: @supabase/supabase-js @supabase/ssr

2. Crear src/lib/supabase/client.ts — cliente para componentes cliente (singleton con createBrowserClient)

3. Crear src/lib/supabase/server.ts — cliente para Server Components y Route Handlers (createServerClient con cookies)

4. Crear src/middleware.ts — middleware de Next.js para:
   - Refrescar sesión en cada request
   - Proteger rutas /dashboard/* redirigiendo a /login si no hay sesión
   - Redirigir a /dashboard si ya hay sesión y va a /login

5. Crear src/types/database.ts con tipos completos inferidos del schema (usar el schema de la migración anterior). Incluir:
   - Tipos para cada tabla (Row, Insert, Update)
   - Tipos para las relaciones (con joins comunes)
   - Enums TypeScript para los valores constantes (TransactionType, PeriodType, etc.)

6. Crear src/lib/supabase/queries/ con archivos de queries optimizadas:
   - transactions.ts: getTransactions (con filtros, paginación cursor-based, joins a category y account), createTransaction, updateTransaction, deleteTransaction (soft)
   - accounts.ts: getAccounts, getAccountWithBalance, createAccount, updateAccount
   - categories.ts: getCategories (sistema + usuario), createCategory
   - budgets.ts: getBudgetsWithProgress (join con sum de transactions del período)
   - dashboard.ts: getDashboardStats (una sola query con multiple CTEs para: balance total, gastos del mes, ingresos del mes, top 5 categorías)

7. Crear src/lib/validations/ con schemas Zod para cada entidad (transaction, account, budget, recurring_item, saving_goal)

Todas las queries deben usar select() con columnas explícitas (nunca select *), tener tipos de retorno explícitos, y manejar errores con un helper tipado.
```

---

## FASE 2 — Autenticación y layout base

### Prompt 4 · Google SSO y flujo de auth

```
Implementa el flujo completo de autenticación con Google SSO usando Supabase Auth.

PÁGINA DE LOGIN (src/app/(auth)/login/page.tsx):
- Diseño limpio y moderno: centrado verticalmente, card con logo de la app, nombre "FinTrack" y tagline
- Botón "Continuar con Google" con ícono de Google (SVG inline)
- Mensaje de privacidad: "Tus datos son privados y solo tú los puedes ver"
- No mostrar formulario de email/password (solo Google)
- Server Component con Client Component para el botón

LÓGICA DE AUTH:
- src/app/(auth)/login/actions.ts — Server Action para iniciar OAuth con Google
- src/app/auth/callback/route.ts — Route Handler para el callback de OAuth:
  * Intercambiar code por sesión
  * En primer login: crear perfil en tabla profiles con datos de Google (nombre, avatar)
  * Redirigir a /dashboard/onboarding si es primer login, o /dashboard si ya tiene perfil completo

ONBOARDING (src/app/(dashboard)/onboarding/page.tsx):
- Wizard de 3 pasos:
  Paso 1: Moneda principal y zona horaria
  Paso 2: Crear primera cuenta (tipo, nombre, saldo inicial)
  Paso 3: Personalizar 3 categorías principales
- Guardar con Server Actions, redirigir a /dashboard al completar

HOOK DE USUARIO:
- src/hooks/useUser.ts — hook client-side para acceder al usuario actual (con React Query para caché)
- src/hooks/useSession.ts — hook para manejar estado de sesión

SIGN OUT:
- Server Action en src/app/(dashboard)/actions.ts para cerrar sesión
- Limpiar caché de React Query al hacer logout

Asegurarse de que el middleware proteja correctamente todas las rutas del dashboard.
```

---

### Prompt 5 · Layout del dashboard

```
Crea el layout principal del dashboard con navegación responsive y performance-first.

LAYOUT (src/app/(dashboard)/layout.tsx):
- Sidebar colapsable en desktop (240px expandido, 64px colapsado), bottom nav en mobile
- Guardar estado de sidebar en localStorage
- Navigation items con íconos (lucide-react):
  * Dashboard (Home)
  * Transacciones (ArrowLeftRight)
  * Presupuestos (PieChart)
  * Metas (Target)
  * Reportes (BarChart3)
  * Configuración (Settings)
- Header con: nombre de la app, selector de período (mes actual con flechas prev/next), avatar del usuario con dropdown (Perfil, Cerrar sesión)
- Indicador de balance total de todas las cuentas en el header

ESTADO GLOBAL (src/stores/):
- useAppStore.ts (Zustand):
  * selectedPeriod: { month: number, year: number }
  * sidebarCollapsed: boolean
  * selectedCurrency: string
- Persistencia en localStorage para sidebarCollapsed y selectedCurrency

COMPONENTES DE LAYOUT:
- src/components/layout/Sidebar.tsx — sidebar con nav, colapsable, active state
- src/components/layout/Header.tsx — header con periodo selector y user menu
- src/components/layout/MobileNav.tsx — bottom navigation para mobile
- src/components/layout/PeriodSelector.tsx — selector mes/año con navegación

TEMAS:
- Soporte dark/light mode con next-themes
- Configurar en globals.css las CSS variables para ambos temas
- Toggle de tema en el dropdown del usuario

Usar React.memo en componentes que no necesitan re-render frecuente. El layout debe ser un Server Component con islands de interactividad mínimos.
```

---

## FASE 3 — Dashboard y transacciones

### Prompt 6 · Dashboard overview

```
Crea la página principal del dashboard con métricas en tiempo real.

PÁGINA (src/app/(dashboard)/page.tsx) — Server Component:
Usar React Suspense con skeletons para cada sección. Los datos se cargan en paralelo con Promise.all.

SECCIONES:

1. CARDS DE RESUMEN (4 cards en grid):
   - Balance total (suma de todas las cuentas activas)
   - Ingresos del mes actual
   - Gastos del mes actual
   - Tasa de ahorro (% ingresos - gastos)
   Cada card con: valor principal, variación vs mes anterior (arrow up/down + %), color semántico

2. GRÁFICO DE FLUJO (área chart, últimos 6 meses):
   - Línea de ingresos vs gastos vs balance neto
   - Usar Recharts con componentes de shadcn/ui charts
   - Tooltip custom con formato de moneda según locale del usuario
   - Responsive con ResponsiveContainer

3. GASTOS POR CATEGORÍA (donut chart + lista):
   - Top 8 categorías del mes
   - Donut chart con colores de las categorías
   - Lista con: ícono, nombre, monto, % del total, barra de progreso
   
4. CUENTAS (lista de tarjetas):
   - Cada cuenta con tipo, nombre, balance, moneda
   - Indicador visual de tendencia (up/down vs mes anterior)
   - Botón "Ver todas"

5. TRANSACCIONES RECIENTES (últimas 5):
   - Tabla compacta: fecha, categoría, descripción, cuenta, monto
   - Botón "Ver todas"

6. ALERTAS ACTIVAS:
   - Presupuestos al límite (>80%)
   - Próximos pagos recurrentes (próximos 7 días)
   - Metas cerca del objetivo

COMPONENTES:
- src/components/charts/FlowChart.tsx
- src/components/charts/CategoryDonut.tsx
- src/components/shared/StatCard.tsx (con animación de número con useCountUp hook)
- src/components/shared/AccountCard.tsx
- src/components/shared/AlertBanner.tsx

Todos los valores monetarios formateados con Intl.NumberFormat usando la moneda y locale del perfil del usuario.
```

---

### Prompt 7 · Módulo de transacciones

```
Crea el módulo completo de transacciones (la funcionalidad más usada).

PÁGINA PRINCIPAL (src/app/(dashboard)/transactions/page.tsx):
- Server Component con URL search params para filtros (persistencia en URL)
- Filtros: período, tipo (ingreso/gasto/transferencia), cuenta, categoría, búsqueda de texto, monto min/max
- Vista lista con paginación cursor-based (no offset, para performance)
- Ordenamiento por fecha desc por defecto

TABLA DE TRANSACCIONES:
- Columnas: fecha, descripción, categoría (con ícono y color), cuenta, monto (coloreado), estado reconciliado
- Row actions: editar, duplicar, eliminar (con confirmación)
- Selección múltiple para acciones en lote (eliminar, cambiar categoría)
- Sticky header al hacer scroll
- Virtualization con @tanstack/react-virtual para listas largas (>100 items)

FORMULARIO DE TRANSACCIÓN (modal/sheet):
- src/components/forms/TransactionForm.tsx
- Campos: tipo (toggle income/expense/transfer), monto, moneda, fecha (date picker), cuenta, categoría (searchable dropdown con íconos), descripción (autocomplete con historial), notas, tags (multi-select), adjunto
- Para transferencias: mostrar campo cuenta destino, ocultar categoría
- Validación en tiempo real con Zod + react-hook-form
- Crear con Server Action, invalidar caché de React Query después
- Acceso rápido desde header (botón "+" flotante en mobile)

IMPORTACIÓN CSV:
- src/app/(dashboard)/transactions/import/page.tsx
- Upload de CSV con drag & drop
- Preview de las primeras 5 filas
- Mapeo de columnas (fecha, descripción, monto, tipo)
- Detección automática de separador y formato de fecha
- Asignación de cuenta destino
- Procesar con Server Action, mostrar resultado (N importadas, M errores)

HOOKS:
- src/hooks/useTransactions.ts — React Query hook con filtros, paginación, optimistic updates
- src/hooks/useTransactionMutations.ts — create/update/delete con optimistic UI

Optimistic updates: al crear una transacción, agregarla inmediatamente al cache de React Query y mostrarla, revertir si hay error.
```

---

## FASE 4 — Presupuestos, metas y recurrentes

### Prompt 8 · Presupuestos

```
Crea el módulo de presupuestos con alertas y tracking en tiempo real.

PÁGINA (src/app/(dashboard)/budgets/page.tsx):
- Vista por período (mes actual por defecto, seleccionable)
- Grid de cards de presupuesto, ordenadas por % ejecutado desc
- Resumen en el header: total presupuestado, total gastado, % global

CARD DE PRESUPUESTO:
- src/components/shared/BudgetCard.tsx
- Ícono y color de la categoría
- Nombre de categoría + período
- Barra de progreso con color semántico:
  * Verde (0-60%)
  * Amarillo (60-80%)
  * Naranja (80-100%)
  * Rojo (>100%)
- Monto gastado / límite + % + días restantes del período
- Proyección: "A este ritmo gastarás $X al final del mes"
- Quick actions: editar, desactivar

FORMULARIO DE PRESUPUESTO:
- Categoría (solo hojas del árbol, no categorías padre)
- Tipo de período (mensual, semanal, anual)
- Monto límite
- ¿Acumular sobrante? (toggle)
- Umbral de alerta (slider 50-100%, default 80%)
- Fechas opcionales de inicio/fin

LÓGICA DE ALERTAS:
- Server Action que se ejecuta al guardar transacciones para verificar si algún presupuesto superó el umbral
- Crear notificación en tabla notifications si supera el umbral
- Mostrar banner en la página de presupuestos con los presupuestos en alerta

QUERY OPTIMIZADA:
- Una sola query con CTE que une budgets + sum de transactions del período actual
- Incluir proyección calculada en SQL: (gastado_hoy / días_transcurridos) * días_del_mes
```

---

### Prompt 9 · Gastos recurrentes y metas

```
Crea dos módulos: gastos recurrentes y metas de ahorro.

MÓDULO RECURRENTES (src/app/(dashboard)/recurring/page.tsx):

Vista principal:
- Lista agrupada por frecuencia (mensuales, semanales, anuales)
- Para cada ítem: nombre, cuenta, categoría, monto, próxima fecha, días restantes
- Badge de estado: "Hoy", "Esta semana", "Próximo mes"
- Calendar view toggle: ver recurrentes en un mini calendario del mes

Formulario:
- Campos: descripción, tipo (ingreso/gasto), monto, cuenta, categoría
- Frecuencia con opciones claras y preview: "Se repetirá el día 15 de cada mes"
- Fecha inicio, fecha fin opcional
- Notificación anticipada (slider 1-30 días)
- Crear automáticamente vs solo recordar (toggle)

Server Action para generar transacciones:
- Función que ejecuta los recurring_items pendientes (next_occurrence_date <= today)
- Actualiza next_occurrence_date según frecuencia
- Crear transacciones correspondientes en la tabla transactions
- Diseñada para ser llamada desde un cron job de Vercel (crear también vercel.json con cron config)

MÓDULO METAS (src/app/(dashboard)/goals/page.tsx):

Vista principal:
- Grid de tarjetas de metas con progreso visual
- Tarjeta: nombre, ícono/emoji, barra de progreso circular, monto actual/objetivo, % completado, proyección de fecha

Formulario de meta:
- Nombre, descripción, emoji picker (simple grid de emojis)
- Monto objetivo, moneda
- Fecha objetivo (optional)
- Cuenta vinculada (optional)

Agregar aporte:
- Modal rápido: monto, fecha, nota
- Opción de vincular a una transacción existente
- Actualizar current_amount en saving_goals

Gráfico de progreso:
- Line chart con aportes históricos
- Línea de proyección punteada hacia el objetivo
- Indicador de "a este ritmo llegas en X meses"
```

---

## FASE 5 — Reportes y configuración

### Prompt 10 · Módulo de reportes

```
Crea el módulo de reportes y análisis financiero.

PÁGINA (src/app/(dashboard)/reports/page.tsx):
- Tabs: Resumen Mensual | Por Categoría | Flujo de Caja | Patrimonio Neto

TAB 1 — RESUMEN MENSUAL:
- Selector de mes/año
- Cards: ingresos totales, gastos totales, balance neto, tasa de ahorro
- Comparación con mes anterior (flechas y porcentaje)
- Bar chart de ingresos vs gastos por semana del mes
- Tabla de gastos por categoría: nombre, monto, % del total, vs mes anterior

TAB 2 — POR CATEGORÍA:
- Selector de período: mes, trimestre, año, custom range
- Treemap de gastos por categoría (usar Recharts Treemap)
- Al hacer click en categoría: drill-down con subcategorías y transacciones
- Top 10 tabla con: categoría, total, cantidad de transacciones, promedio por transacción

TAB 3 — FLUJO DE CAJA:
- Area chart stackeado últimos 12 meses: ingresos vs gastos
- Línea de balance neto
- Proyección próximos 3 meses basada en promedios + recurrentes conocidos
- Tabla mensual con todos los valores

TAB 4 — PATRIMONIO NETO:
- Line chart evolución del patrimonio neto (usando monthly_snapshots)
- Desglose actual: activos (cuentas tipo asset) vs pasivos (cuentas tipo liability)
- Waterfall chart de cambios en el período

EXPORTACIÓN:
- Botón "Exportar CSV" en cada tab — genera y descarga el CSV correspondiente
- Server Action que genera el CSV con los datos del período seleccionado
- Nombre de archivo descriptivo: "fintrack-gastos-por-categoria-2025-01.csv"

SERVER ACTION — SNAPSHOT MENSUAL:
- Función para calcular y guardar/actualizar monthly_snapshots del mes anterior
- Llamada automáticamente al cargar reportes si falta el snapshot del mes anterior
```

---

### Prompt 11 · Configuración del usuario

```
Crea el módulo de configuración completo.

PÁGINA (src/app/(dashboard)/settings/page.tsx):
Tabs: Perfil | Cuentas | Categorías | Notificaciones | Datos

TAB PERFIL:
- Editar nombre, zona horaria, moneda base, locale (formato de fecha/número)
- Avatar: mostrar el de Google, opción de subir uno custom (upload a Supabase Storage)
- Cambios guardados con Server Action y toast de confirmación

TAB CUENTAS:
- Lista de cuentas con drag & drop para reordenar (usando @dnd-kit/core)
- Crear, editar, archivar cuentas
- Para cada cuenta: mostrar tipo, balance actual, moneda, estado
- Formulario completo con todos los campos del schema
- Reconciliación manual: marcar transacciones como reconciliadas

TAB CATEGORÍAS:
- Tree view de categorías (padre → hijos)
- Diferenciación visual entre categorías del sistema (no editables) y del usuario
- CRUD de categorías personalizadas
- Color picker (paleta de 16 colores predefinidos + custom hex)
- Ícono picker (grid de íconos de lucide-react más comunes)
- Drag & drop para reordenar

TAB NOTIFICACIONES:
- Toggle para cada tipo de notificación
- Canal: in-app y/o email
- Configurar días de anticipación para recordatorios de recurrentes
- Preview de cómo se verá cada notificación

TAB DATOS:
- Exportar TODOS los datos en CSV (una archivo zip con múltiples CSVs)
- Importar datos (link al módulo de importación)
- Zona peligrosa: eliminar todos los datos del período / eliminar cuenta
- Estos botones con confirmación extra (tipear "CONFIRMAR")

CENTRO DE NOTIFICACIONES:
- Ícono en el header con badge de no leídas
- Dropdown con últimas 10 notificaciones
- Marcar como leída, marcar todas como leídas
- Link a la entidad relacionada al hacer click
```

---

## FASE 6 — Performance, PWA y deploy

### Prompt 12 · Optimizaciones de performance

```
Implementa todas las optimizaciones de performance para producción.

CACHÉ Y REVALIDACIÓN:
- Configurar React Query con: staleTime 5 minutos para datos no críticos, 30 segundos para balances
- Añadir revalidatePath/revalidateTag apropiados en todos los Server Actions
- Implementar caché de Next.js con tags para invalidación granular:
  * tag 'transactions' para todas las queries de transacciones
  * tag 'accounts' para cuentas y balances  
  * tag 'budgets' para presupuestos
  * tag 'dashboard' para el dashboard (invalida con cualquier cambio)

OPTIMISTIC UPDATES:
- Implementar en: crear transacción, eliminar transacción, marcar notificación como leída
- Patrón consistente: actualizar cache local → ejecutar mutation → revertir en error con toast

LAZY LOADING:
- Dynamic imports con next/dynamic para: gráficos (Recharts), formularios modales, el módulo de importación CSV
- Suspense boundaries apropiados con skeletons matching el contenido real

CÓDIGO:
- Memoización con useMemo/useCallback en componentes que lo necesiten (identificar con React DevTools)
- Evitar re-renders: separar estado UI (Zustand) del estado del servidor (React Query)

IMÁGENES Y ASSETS:
- Favicon, apple-touch-icon, og:image (1200x630)
- Configurar manifest.json para PWA con íconos en todos los tamaños

PWA:
- Instalar next-pwa, configurar en next.config.js
- Service worker con estrategia: NetworkFirst para API calls, CacheFirst para assets estáticos
- Manifest con: name, short_name, theme_color, background_color, display standalone, start_url, íconos

MONITORING:
- Instalar @vercel/analytics y @vercel/speed-insights
- Agregar <Analytics /> y <SpeedInsights /> en el root layout
- Configurar Web Vitals tracking

Verificar bundle size con next build y analizar con @next/bundle-analyzer. El bundle del cliente no debe superar 200KB gzipped en la ruta del dashboard.
```

---

### Prompt 13 · Variables de entorno y deploy a Vercel

```
Configura el proyecto para producción y realiza el primer deploy.

1. VARIABLES DE ENTORNO:
Crear/actualizar .env.local.example con TODAS las variables:
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  NEXT_PUBLIC_APP_URL=
  CRON_SECRET=  (string random para proteger endpoints de cron)

2. CRON JOB (vercel.json):
{
  "crons": [
    {
      "path": "/api/cron/process-recurring",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/monthly-snapshot", 
      "schedule": "0 2 1 * *"
    }
  ]
}

Crear los route handlers correspondientes en src/app/api/cron/:
- Verificar header Authorization: Bearer {CRON_SECRET}
- process-recurring: ejecutar recurring_items vencidos
- monthly-snapshot: generar snapshot del mes anterior para todos los usuarios

3. HEADERS DE SEGURIDAD (next.config.js):
Configurar headers: X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy, Content-Security-Policy apropiado para Supabase

4. CHECKLIST DE DEPLOY:
Verificar y corregir si es necesario:
- [ ] next build sin errores ni warnings
- [ ] TypeScript sin errores (npx tsc --noEmit)
- [ ] ESLint sin errores (next lint)
- [ ] Todas las variables de entorno documentadas
- [ ] RLS habilitado y testeado en Supabase
- [ ] Seed data aplicado en producción
- [ ] Google OAuth callback URL actualizada con dominio de Vercel

5. GITHUB ACTIONS (.github/workflows/ci.yml):
Workflow que en cada PR:
- Instala dependencias
- Ejecuta TypeScript check
- Ejecuta ESLint
- Ejecuta next build
- Comenta en el PR si hay errores

Después de completar todo esto, ejecutar: vercel --prod
Documentar en README.md los pasos completos de setup para un entorno nuevo.
```

---

## Orden de ejecución recomendado

| # | Prompt | Tiempo est. | Resultado |
|---|--------|-------------|-----------|
| 1 | Scaffold | 15 min | Proyecto inicializado |
| 2 | Schema SQL | 20 min | DB completa en Supabase |
| 3 | Cliente + tipos | 15 min | Capa de datos lista |
| 4 | Auth + Google SSO | 20 min | Login funcional |
| 5 | Layout dashboard | 20 min | Navegación completa |
| 6 | Dashboard overview | 25 min | Métricas en pantalla |
| 7 | Transacciones | 30 min | CRUD completo |
| 8 | Presupuestos | 20 min | Tracking de gastos |
| 9 | Recurrentes + Metas | 25 min | Planificación |
| 10 | Reportes | 25 min | Análisis completo |
| 11 | Configuración | 20 min | Settings completo |
| 12 | Performance + PWA | 15 min | App instalable |
| 13 | Deploy | 15 min | Producción live |

**Total estimado: ~4-5 horas de trabajo con Claude Code**

---

## Notas importantes

**Después del Prompt 2**, ejecutar en Supabase SQL Editor:
```bash
# Aplicar migración
supabase db push

# O directamente en el SQL Editor de la consola de Supabase
```

**Después del Prompt 3**, generar tipos automáticamente:
```bash
npx supabase gen types typescript --project-id <tu-project-id> > src/types/database.ts
```

**Para conectar Supabase con Claude Code** (opcional pero recomendado):
En Claude Code ejecutar `/mcp` y agregar el MCP de Supabase para que pueda consultar y modificar la DB directamente.

**Cada prompt debe ejecutarse** con el repo en el estado del prompt anterior. Si algo falla, pedirle a Claude Code que lo corrija antes de continuar.
