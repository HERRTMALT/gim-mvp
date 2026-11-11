// AUTO-GENERADO por scripts/generate-migrations.mjs. No editar a mano.
// Ejecutar `npm run build` (o `npm run migrations:generate`) para regenerarlo.

export type Migration = { version: string; sql: string };

export const MIGRATIONS: Migration[] = [
  {
    version: "001_init.sql",
    sql: `CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT,
  birth_date TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_name TEXT,
  emergency_phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_members_name ON members(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_members_dni ON members(dni);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);

CREATE TABLE IF NOT EXISTS member_health (
  member_id INTEGER PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  conditions_json TEXT NOT NULL DEFAULT '[]',
  injuries TEXT NOT NULL DEFAULT '',
  medications TEXT NOT NULL DEFAULT '',
  medical_clearance INTEGER NOT NULL DEFAULT 0,
  medical_clearance_expires_on TEXT,
  consent_signed_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  days_per_week INTEGER NOT NULL UNIQUE CHECK (days_per_week IN (3, 4, 5)),
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_memberships_member ON memberships(member_id, ends_on DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_end ON memberships(ends_on);

CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  primary_muscles TEXT NOT NULL,
  secondary_muscles TEXT NOT NULL DEFAULT '',
  equipment TEXT NOT NULL,
  difficulty INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  impact TEXT NOT NULL DEFAULT 'low',
  contraindications TEXT NOT NULL DEFAULT '',
  sport_tags TEXT NOT NULL DEFAULT '',
  instructions TEXT NOT NULL,
  alternatives TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_exercises_pattern ON exercises(pattern);

CREATE TABLE IF NOT EXISTS routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'final' CHECK (status IN ('draft', 'final', 'archived')),
  source TEXT NOT NULL DEFAULT 'auto' CHECK (source IN ('auto', 'manual')),
  rules_version TEXT NOT NULL,
  input_json TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  warnings_json TEXT NOT NULL DEFAULT '[]',
  seed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(member_id, version)
);

CREATE INDEX IF NOT EXISTS idx_routines_member ON routines(member_id, version DESC);
`,
  },
];
