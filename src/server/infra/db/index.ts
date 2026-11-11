import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import Database from 'libsql';
import { env } from '../../config/env';

/**
 * La app puede usar dos backends:
 *
 * - SQLite local (desarrollo, Docker, VPS): `DATABASE_PATH`.
 * - libSQL/Turso remoto (Vercel u otro entorno serverless): `TURSO_DATABASE_URL`.
 *
 * En Vercel el filesystem es de solo lectura y efímero, por eso la base no
 * puede vivir en `./data/gym.sqlite`. El driver `libsql` mantiene la misma API
 * síncrona que `node:sqlite`, así que el resto del código no cambia.
 */
const remoteUrl = env.TURSO_DATABASE_URL?.trim();
const isRemote = Boolean(remoteUrl);

const databasePath = isRemote
  ? remoteUrl!
  : env.DATABASE_PATH === ':memory:'
    ? ':memory:'
    : resolve(process.cwd(), env.DATABASE_PATH);

if (!isRemote && databasePath !== ':memory:') {
  mkdirSync(dirname(databasePath), { recursive: true });
}

// Los tipos publicados de `libsql` son los de better-sqlite3 y no incluyen
// `authToken`, aunque el runtime sí lo acepta (ver README del paquete).
type LibsqlOptions = ConstructorParameters<typeof Database>[1];

const dbOptions = isRemote
  ? ({ authToken: env.TURSO_AUTH_TOKEN } as unknown as LibsqlOptions)
  : undefined;

export const db = new Database(databasePath, dbOptions);

if (isRemote) {
  // En libSQL remoto no se puede forzar WAL, pero sí las foreign keys.
  db.exec('PRAGMA foreign_keys = ON;');
} else {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    PRAGMA synchronous = NORMAL;
  `);
}

export type SqlValue = string | number | bigint | null | Uint8Array;

type RowWithMetadata = Record<string, unknown> & { _metadata?: unknown };

function withoutMetadata<T>(row: RowWithMetadata | undefined): T | undefined {
  if (!row) return undefined;
  const { _metadata: _ignored, ...rest } = row;
  return rest as T;
}

export function queryAll<T>(sql: string, params: SqlValue[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}

export function queryOne<T>(sql: string, params: SqlValue[] = []): T | undefined {
  return withoutMetadata<T>(db.prepare(sql).get(...params) as RowWithMetadata | undefined);
}

export function execute(
  sql: string,
  params: SqlValue[] = [],
): { changes: number; lastInsertRowid: number } {
  const result = db.prepare(sql).run(...params);
  return {
    changes: Number(result.changes),
    lastInsertRowid: Number(result.lastInsertRowid),
  };
}

export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function closeDb(): void {
  db.close();
}
