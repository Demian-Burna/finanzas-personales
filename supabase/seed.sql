-- ============================================================
-- SEED DATA
-- Project: Finanzas Personales
-- Run AFTER migrations.  Safe to re-run (ON CONFLICT DO NOTHING).
-- ============================================================


-- ┌─────────────────────────────────────────────────────────┐
-- │ 1. CURRENCIES  (ISO 4217 — common subset)               │
-- └─────────────────────────────────────────────────────────┘
-- code, name, symbol, decimal_places, is_active

INSERT INTO currencies (code, name, symbol, decimal_places, is_active) VALUES
  -- South America
  ('ARS', 'Peso Argentino',        '$',   2, true),
  ('BRL', 'Real Brasileño',        'R$',  2, true),
  ('CLP', 'Peso Chileno',          '$',   0, true),
  ('COP', 'Peso Colombiano',       '$',   2, true),
  ('PEN', 'Sol Peruano',           'S/',  2, true),
  ('UYU', 'Peso Uruguayo',         '$U',  2, true),
  ('PYG', 'Guaraní Paraguayo',     '₲',   0, true),
  ('BOB', 'Boliviano',             'Bs.', 2, true),
  ('VES', 'Bolívar Venezolano',    'Bs.', 2, true),
  -- North & Central America
  ('USD', 'Dólar Estadounidense',  'US$', 2, true),
  ('CAD', 'Dólar Canadiense',      'CA$', 2, true),
  ('MXN', 'Peso Mexicano',         '$',   2, true),
  -- Europe
  ('EUR', 'Euro',                  '€',   2, true),
  ('GBP', 'Libra Esterlina',       '£',   2, true),
  ('CHF', 'Franco Suizo',          'Fr',  2, true),
  ('SEK', 'Corona Sueca',          'kr',  2, true),
  ('NOK', 'Corona Noruega',        'kr',  2, true),
  ('DKK', 'Corona Danesa',         'kr',  2, true),
  ('PLN', 'Esloti Polaco',         'zł',  2, true),
  -- Asia & Oceania
  ('JPY', 'Yen Japonés',           '¥',   0, true),
  ('CNY', 'Yuan Chino',            '¥',   2, true),
  ('AUD', 'Dólar Australiano',     'A$',  2, true),
  ('NZD', 'Dólar Neozelandés',     'NZ$', 2, true),
  ('INR', 'Rupia India',           '₹',   2, true),
  -- Digital / Crypto (for tracking, not FX)
  ('BTC', 'Bitcoin',               '₿',   8, true),
  ('ETH', 'Ethereum',              'Ξ',   8, true)
ON CONFLICT (code) DO NOTHING;


-- ┌─────────────────────────────────────────────────────────┐
-- │ 2. SYSTEM CATEGORIES                                    │
-- └─────────────────────────────────────────────────────────┘
-- Fixed UUIDs allow stable references across environments.
-- Pattern:
--   00000000-0000-0000-0001-xxxxxxxxxxxx  → expense root categories
--   00000000-0000-0000-0002-xxxxxxxxxxxx  → expense subcategories
--   00000000-0000-0000-0003-xxxxxxxxxxxx  → income root categories
--   00000000-0000-0000-0004-xxxxxxxxxxxx  → income subcategories
--   00000000-0000-0000-0005-xxxxxxxxxxxx  → transfer categories
--
-- color: hex codes from a warm, accessible palette.
-- icon:  lucide-react icon names.
-- ────────────────────────────────────────────────────────────

-- ──────────────────────────────────────────
-- 2a. EXPENSE ROOT CATEGORIES
-- ──────────────────────────────────────────
INSERT INTO categories
  (id, user_id, parent_id, name, color, icon, transaction_type, is_system, sort_order)
VALUES
  -- Alimentación
  ('00000000-0000-0000-0001-000000000001', NULL, NULL,
   'Alimentación',     '#ef4444', 'shopping-cart',  'expense', true,  1),
  -- Transporte
  ('00000000-0000-0000-0001-000000000002', NULL, NULL,
   'Transporte',       '#f97316', 'car',             'expense', true,  2),
  -- Vivienda
  ('00000000-0000-0000-0001-000000000003', NULL, NULL,
   'Vivienda',         '#eab308', 'home',            'expense', true,  3),
  -- Salud
  ('00000000-0000-0000-0001-000000000004', NULL, NULL,
   'Salud',            '#22c55e', 'heart-pulse',     'expense', true,  4),
  -- Educación
  ('00000000-0000-0000-0001-000000000005', NULL, NULL,
   'Educación',        '#3b82f6', 'graduation-cap',  'expense', true,  5),
  -- Entretenimiento
  ('00000000-0000-0000-0001-000000000006', NULL, NULL,
   'Entretenimiento',  '#8b5cf6', 'tv',              'expense', true,  6),
  -- Ropa y calzado
  ('00000000-0000-0000-0001-000000000007', NULL, NULL,
   'Ropa y calzado',   '#ec4899', 'shirt',           'expense', true,  7),
  -- Tecnología
  ('00000000-0000-0000-0001-000000000008', NULL, NULL,
   'Tecnología',       '#06b6d4', 'smartphone',      'expense', true,  8),
  -- Cuidado personal
  ('00000000-0000-0000-0001-000000000009', NULL, NULL,
   'Cuidado personal', '#f59e0b', 'sparkles',        'expense', true,  9),
  -- Mascotas
  ('00000000-0000-0000-0001-000000000010', NULL, NULL,
   'Mascotas',         '#84cc16', 'paw-print',       'expense', true, 10),
  -- Viajes
  ('00000000-0000-0000-0001-000000000011', NULL, NULL,
   'Viajes',           '#14b8a6', 'plane',           'expense', true, 11),
  -- Impuestos y tasas
  ('00000000-0000-0000-0001-000000000012', NULL, NULL,
   'Impuestos y tasas','#6b7280', 'receipt',         'expense', true, 12),
  -- Restaurantes y bares
  ('00000000-0000-0000-0001-000000000013', NULL, NULL,
   'Restaurantes',     '#f43f5e', 'utensils',        'expense', true, 13),
  -- Otros gastos
  ('00000000-0000-0000-0001-000000000099', NULL, NULL,
   'Otros gastos',     '#94a3b8', 'circle-ellipsis', 'expense', true, 99)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────
-- 2b. EXPENSE SUBCATEGORIES
-- ──────────────────────────────────────────
INSERT INTO categories
  (id, user_id, parent_id, name, color, icon, transaction_type, is_system, sort_order)
VALUES
  -- Alimentación → Supermercado
  ('00000000-0000-0000-0002-000000000001', NULL,
   '00000000-0000-0000-0001-000000000001',
   'Supermercado',    '#ef4444', 'shopping-basket', 'expense', true, 1),
  -- Alimentación → Delivery / Pedidos
  ('00000000-0000-0000-0002-000000000002', NULL,
   '00000000-0000-0000-0001-000000000001',
   'Delivery',        '#ef4444', 'package',         'expense', true, 2),
  -- Alimentación → Almacén / Kiosco
  ('00000000-0000-0000-0002-000000000003', NULL,
   '00000000-0000-0000-0001-000000000001',
   'Almacén',         '#ef4444', 'store',           'expense', true, 3),

  -- Transporte → Combustible
  ('00000000-0000-0000-0002-000000000010', NULL,
   '00000000-0000-0000-0001-000000000002',
   'Combustible',     '#f97316', 'fuel',            'expense', true, 1),
  -- Transporte → Transporte público
  ('00000000-0000-0000-0002-000000000011', NULL,
   '00000000-0000-0000-0001-000000000002',
   'Transporte público','#f97316','bus',             'expense', true, 2),
  -- Transporte → Taxi / Rideshare
  ('00000000-0000-0000-0002-000000000012', NULL,
   '00000000-0000-0000-0001-000000000002',
   'Taxi / Rideshare','#f97316', 'car-taxi-front',  'expense', true, 3),
  -- Transporte → Estacionamiento
  ('00000000-0000-0000-0002-000000000013', NULL,
   '00000000-0000-0000-0001-000000000002',
   'Estacionamiento', '#f97316', 'parking-square',  'expense', true, 4),
  -- Transporte → Mantenimiento auto
  ('00000000-0000-0000-0002-000000000014', NULL,
   '00000000-0000-0000-0001-000000000002',
   'Mantenimiento auto','#f97316','wrench',          'expense', true, 5),

  -- Vivienda → Alquiler / Hipoteca
  ('00000000-0000-0000-0002-000000000020', NULL,
   '00000000-0000-0000-0001-000000000003',
   'Alquiler',        '#eab308', 'key',             'expense', true, 1),
  -- Vivienda → Electricidad
  ('00000000-0000-0000-0002-000000000021', NULL,
   '00000000-0000-0000-0001-000000000003',
   'Electricidad',    '#eab308', 'zap',             'expense', true, 2),
  -- Vivienda → Gas
  ('00000000-0000-0000-0002-000000000022', NULL,
   '00000000-0000-0000-0001-000000000003',
   'Gas',             '#eab308', 'flame',           'expense', true, 3),
  -- Vivienda → Agua
  ('00000000-0000-0000-0002-000000000023', NULL,
   '00000000-0000-0000-0001-000000000003',
   'Agua',            '#eab308', 'droplets',        'expense', true, 4),
  -- Vivienda → Internet / Telefonía
  ('00000000-0000-0000-0002-000000000024', NULL,
   '00000000-0000-0000-0001-000000000003',
   'Internet / Telefonía','#eab308','wifi',          'expense', true, 5),
  -- Vivienda → Expensas
  ('00000000-0000-0000-0002-000000000025', NULL,
   '00000000-0000-0000-0001-000000000003',
   'Expensas',        '#eab308', 'building',        'expense', true, 6),
  -- Vivienda → Reparaciones
  ('00000000-0000-0000-0002-000000000026', NULL,
   '00000000-0000-0000-0001-000000000003',
   'Reparaciones',    '#eab308', 'hammer',          'expense', true, 7),

  -- Salud → Médico / Consulta
  ('00000000-0000-0000-0002-000000000030', NULL,
   '00000000-0000-0000-0001-000000000004',
   'Médico',          '#22c55e', 'stethoscope',     'expense', true, 1),
  -- Salud → Farmacia
  ('00000000-0000-0000-0002-000000000031', NULL,
   '00000000-0000-0000-0001-000000000004',
   'Farmacia',        '#22c55e', 'pill',            'expense', true, 2),
  -- Salud → Obra social / Prepaga
  ('00000000-0000-0000-0002-000000000032', NULL,
   '00000000-0000-0000-0001-000000000004',
   'Obra social',     '#22c55e', 'shield-check',    'expense', true, 3),
  -- Salud → Gimnasio / Deporte
  ('00000000-0000-0000-0002-000000000033', NULL,
   '00000000-0000-0000-0001-000000000004',
   'Gimnasio',        '#22c55e', 'dumbbell',        'expense', true, 4),

  -- Educación → Cuotas / Aranceles
  ('00000000-0000-0000-0002-000000000040', NULL,
   '00000000-0000-0000-0001-000000000005',
   'Cuotas escolares','#3b82f6', 'school',          'expense', true, 1),
  -- Educación → Cursos / Capacitación
  ('00000000-0000-0000-0002-000000000041', NULL,
   '00000000-0000-0000-0001-000000000005',
   'Cursos',          '#3b82f6', 'book-open',       'expense', true, 2),
  -- Educación → Material / Útiles
  ('00000000-0000-0000-0002-000000000042', NULL,
   '00000000-0000-0000-0001-000000000005',
   'Útiles escolares','#3b82f6', 'pencil',          'expense', true, 3),
  -- Educación → Libros
  ('00000000-0000-0000-0002-000000000043', NULL,
   '00000000-0000-0000-0001-000000000005',
   'Libros',          '#3b82f6', 'book',            'expense', true, 4),

  -- Entretenimiento → Streaming
  ('00000000-0000-0000-0002-000000000050', NULL,
   '00000000-0000-0000-0001-000000000006',
   'Streaming',       '#8b5cf6', 'play-circle',     'expense', true, 1),
  -- Entretenimiento → Cine / Teatro
  ('00000000-0000-0000-0002-000000000051', NULL,
   '00000000-0000-0000-0001-000000000006',
   'Cine / Teatro',   '#8b5cf6', 'clapperboard',    'expense', true, 2),
  -- Entretenimiento → Videojuegos
  ('00000000-0000-0000-0002-000000000052', NULL,
   '00000000-0000-0000-0001-000000000006',
   'Videojuegos',     '#8b5cf6', 'gamepad-2',       'expense', true, 3),
  -- Entretenimiento → Deportes / Actividades
  ('00000000-0000-0000-0002-000000000053', NULL,
   '00000000-0000-0000-0001-000000000006',
   'Deportes',        '#8b5cf6', 'trophy',          'expense', true, 4),
  -- Entretenimiento → Suscripciones
  ('00000000-0000-0000-0002-000000000054', NULL,
   '00000000-0000-0000-0001-000000000006',
   'Suscripciones',   '#8b5cf6', 'repeat',          'expense', true, 5),

  -- Tecnología → Dispositivos
  ('00000000-0000-0000-0002-000000000060', NULL,
   '00000000-0000-0000-0001-000000000008',
   'Dispositivos',    '#06b6d4', 'laptop',          'expense', true, 1),
  -- Tecnología → Software / Apps
  ('00000000-0000-0000-0002-000000000061', NULL,
   '00000000-0000-0000-0001-000000000008',
   'Software / Apps', '#06b6d4', 'app-window',      'expense', true, 2),
  -- Tecnología → Reparaciones tech
  ('00000000-0000-0000-0002-000000000062', NULL,
   '00000000-0000-0000-0001-000000000008',
   'Reparaciones',    '#06b6d4', 'wrench',          'expense', true, 3),

  -- Viajes → Alojamiento
  ('00000000-0000-0000-0002-000000000070', NULL,
   '00000000-0000-0000-0001-000000000011',
   'Alojamiento',     '#14b8a6', 'hotel',           'expense', true, 1),
  -- Viajes → Vuelos / Pasajes
  ('00000000-0000-0000-0002-000000000071', NULL,
   '00000000-0000-0000-0001-000000000011',
   'Vuelos / Pasajes','#14b8a6', 'plane-takeoff',   'expense', true, 2),
  -- Viajes → Actividades turísticas
  ('00000000-0000-0000-0002-000000000072', NULL,
   '00000000-0000-0000-0001-000000000011',
   'Actividades',     '#14b8a6', 'map-pin',         'expense', true, 3),

  -- Restaurantes → Almuerzo
  ('00000000-0000-0000-0002-000000000080', NULL,
   '00000000-0000-0000-0001-000000000013',
   'Almuerzo',        '#f43f5e', 'soup',            'expense', true, 1),
  -- Restaurantes → Café / Desayuno
  ('00000000-0000-0000-0002-000000000081', NULL,
   '00000000-0000-0000-0001-000000000013',
   'Café',            '#f43f5e', 'coffee',          'expense', true, 2),
  -- Restaurantes → Cena / Salida
  ('00000000-0000-0000-0002-000000000082', NULL,
   '00000000-0000-0000-0001-000000000013',
   'Cena / Salida',   '#f43f5e', 'wine',            'expense', true, 3)

ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────
-- 2c. INCOME ROOT CATEGORIES
-- ──────────────────────────────────────────
INSERT INTO categories
  (id, user_id, parent_id, name, color, icon, transaction_type, is_system, sort_order)
VALUES
  -- Trabajo / Empleo
  ('00000000-0000-0000-0003-000000000001', NULL, NULL,
   'Trabajo',         '#16a34a', 'briefcase',       'income', true, 1),
  -- Freelance / Independiente
  ('00000000-0000-0000-0003-000000000002', NULL, NULL,
   'Freelance',       '#0ea5e9', 'laptop',          'income', true, 2),
  -- Inversiones
  ('00000000-0000-0000-0003-000000000003', NULL, NULL,
   'Inversiones',     '#7c3aed', 'trending-up',     'income', true, 3),
  -- Alquiler / Renta
  ('00000000-0000-0000-0003-000000000004', NULL, NULL,
   'Alquiler cobrado','#ca8a04', 'building-2',      'income', true, 4),
  -- Ventas
  ('00000000-0000-0000-0003-000000000005', NULL, NULL,
   'Ventas',          '#059669', 'tag',             'income', true, 5),
  -- Regalos / Premios
  ('00000000-0000-0000-0003-000000000006', NULL, NULL,
   'Regalos y premios','#db2777','gift',             'income', true, 6),
  -- Reembolsos
  ('00000000-0000-0000-0003-000000000007', NULL, NULL,
   'Reembolsos',      '#0891b2', 'rotate-ccw',      'income', true, 7),
  -- Otros ingresos
  ('00000000-0000-0000-0003-000000000099', NULL, NULL,
   'Otros ingresos',  '#94a3b8', 'circle-ellipsis', 'income', true, 99)
ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────
-- 2d. INCOME SUBCATEGORIES
-- ──────────────────────────────────────────
INSERT INTO categories
  (id, user_id, parent_id, name, color, icon, transaction_type, is_system, sort_order)
VALUES
  -- Trabajo → Sueldo / Salario
  ('00000000-0000-0000-0004-000000000001', NULL,
   '00000000-0000-0000-0003-000000000001',
   'Sueldo',          '#16a34a', 'wallet',          'income', true, 1),
  -- Trabajo → Bonus / Aguinaldo
  ('00000000-0000-0000-0004-000000000002', NULL,
   '00000000-0000-0000-0003-000000000001',
   'Bonus / Aguinaldo','#16a34a','star',             'income', true, 2),
  -- Trabajo → Horas extra
  ('00000000-0000-0000-0004-000000000003', NULL,
   '00000000-0000-0000-0003-000000000001',
   'Horas extra',     '#16a34a', 'clock',           'income', true, 3),
  -- Trabajo → Viáticos
  ('00000000-0000-0000-0004-000000000004', NULL,
   '00000000-0000-0000-0003-000000000001',
   'Viáticos',        '#16a34a', 'receipt',         'income', true, 4),

  -- Freelance → Proyecto
  ('00000000-0000-0000-0004-000000000010', NULL,
   '00000000-0000-0000-0003-000000000002',
   'Proyecto',        '#0ea5e9', 'folder',          'income', true, 1),
  -- Freelance → Consultoría
  ('00000000-0000-0000-0004-000000000011', NULL,
   '00000000-0000-0000-0003-000000000002',
   'Consultoría',     '#0ea5e9', 'users',           'income', true, 2),

  -- Inversiones → Dividendos
  ('00000000-0000-0000-0004-000000000020', NULL,
   '00000000-0000-0000-0003-000000000003',
   'Dividendos',      '#7c3aed', 'bar-chart-2',     'income', true, 1),
  -- Inversiones → Intereses
  ('00000000-0000-0000-0004-000000000021', NULL,
   '00000000-0000-0000-0003-000000000003',
   'Intereses',       '#7c3aed', 'percent',         'income', true, 2),
  -- Inversiones → Ganancias de capital
  ('00000000-0000-0000-0004-000000000022', NULL,
   '00000000-0000-0000-0003-000000000003',
   'Ganancias capital','#7c3aed','trending-up',      'income', true, 3),
  -- Inversiones → Plazo fijo / FCI
  ('00000000-0000-0000-0004-000000000023', NULL,
   '00000000-0000-0000-0003-000000000003',
   'Plazo fijo / FCI','#7c3aed', 'landmark',        'income', true, 4)

ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────
-- 2e. TRANSFER CATEGORY  (single, no subcategories)
-- ──────────────────────────────────────────
INSERT INTO categories
  (id, user_id, parent_id, name, color, icon, transaction_type, is_system, sort_order)
VALUES
  ('00000000-0000-0000-0005-000000000001', NULL, NULL,
   'Transferencia entre cuentas', '#64748b', 'arrow-left-right', 'transfer', true, 1)
ON CONFLICT (id) DO NOTHING;
