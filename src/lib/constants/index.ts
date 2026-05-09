export const APP_NAME = 'Finanzas Personales'

export const CURRENCY = {
  DEFAULT: 'ARS',
  LOCALE: 'es-AR',
} as const

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
} as const

export const BUDGET_PERIODS = {
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  TRANSACTIONS: '/transactions',
  BUDGETS: '/budgets',
  GOALS: '/goals',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const

export const QUERY_KEYS = {
  ACCOUNTS: ['accounts'],
  TRANSACTIONS: ['transactions'],
  CATEGORIES: ['categories'],
  BUDGETS: ['budgets'],
  GOALS: ['goals'],
} as const
